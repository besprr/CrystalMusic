DROP DATABASE IF EXISTS CrystalMusic;
GO

CREATE DATABASE CrystalMusic;
GO

USE CrystalMusic;
GO

INSERT INTO Employees (FullName, Position, HireDate) VALUES
('Иванов Иван', 'Звукорежиссер', '2022-01-15'),
('Петров Пётр', 'Администратор', '2021-07-01'),
('Сидоров Сидор', 'Звукорежиссер', '2023-03-12'),
('Артемчик Артем', 'Звукорежиссер', '2020-11-05');


ALTER TRIGGER trg_MoveCancelledBooking
ON Bookings
AFTER UPDATE
AS
BEGIN
    INSERT INTO RejectedBookings (
        BookingID, 
        UserID, 
        RoomID, 
        ServiceID, 
        StartTime, 
        EndTime,
        CancellationReason
    )
    SELECT 
        i.BookingID,
        i.UserID,
        i.RoomID,
        i.ServiceID,
        i.StartTime,
        i.EndTime,
        'Отклонено администратором' -- Базовая причина
    FROM inserted i
    WHERE i.Status = 'Cancelled';

    DELETE FROM Bookings
    WHERE BookingID IN (
        SELECT BookingID FROM inserted WHERE Status = 'Cancelled'
    );
END;

CREATE TABLE Roles (
    RoleID INT PRIMARY KEY IDENTITY(1,1),
    RoleName NVARCHAR(50) NOT NULL UNIQUE
);


CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    RoleID INT NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    RegistrationDate DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);

CREATE TABLE RefreshTokens (
    TokenID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL,
    Token NVARCHAR(512) NOT NULL UNIQUE,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    ExpiresAt DATETIME NOT NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

CREATE TABLE Categories (
    CategoryID INT PRIMARY KEY IDENTITY(1,1),
    CategoryName NVARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE Services (
    ServiceID INT PRIMARY KEY IDENTITY(1,1),
    CategoryID INT NOT NULL,
    ServiceName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    BaseColor NVARCHAR(7) NOT NULL DEFAULT '#FFFFFF',
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);

CREATE TABLE Rooms (
    RoomID INT PRIMARY KEY IDENTITY(1,1),
    RoomName NVARCHAR(100) NOT NULL,
    Capacity INT NOT NULL CHECK (Capacity > 0),
    IsAvailable BIT NOT NULL DEFAULT 1
);

CREATE TABLE Bookings (
    BookingID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL,
    RoomID INT NOT NULL,
    ServiceID INT NOT NULL,
    StartTime DATETIME NOT NULL,
    EndTime DATETIME NOT NULL,
    Status NVARCHAR(20) NOT NULL CHECK (Status IN ('Pending', 'Confirmed', 'Cancelled')) DEFAULT 'Pending',
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (RoomID) REFERENCES Rooms(RoomID),
    FOREIGN KEY (ServiceID) REFERENCES Services(ServiceID),
    CHECK (EndTime > StartTime)
);

CREATE TABLE RejectedBookings (
    RejectedBookingID INT PRIMARY KEY IDENTITY(1,1),
    BookingID INT NOT NULL,  
    UserID INT NOT NULL,
    RoomID INT NOT NULL,
    ServiceID INT NOT NULL,
    StartTime DATETIME NOT NULL,
    EndTime DATETIME NOT NULL,
    CancellationReason NVARCHAR(255),  
    CancellationDate DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (RoomID) REFERENCES Rooms(RoomID),
    FOREIGN KEY (ServiceID) REFERENCES Services(ServiceID)
);

CREATE TRIGGER trg_MoveCancelledBooking
ON Bookings
AFTER UPDATE
AS

    INSERT INTO RejectedBookings (BookingID, UserID, RoomID, ServiceID, StartTime, EndTime)
    SELECT 
        i.BookingID,
        i.UserID,
        i.RoomID,
        i.ServiceID,
        i.StartTime,
        i.EndTime
    FROM inserted i
    WHERE i.Status = 'Cancelled';

    DELETE FROM Bookings
    WHERE BookingID IN (
        SELECT BookingID FROM inserted WHERE Status = 'Cancelled'
    );
END;

CREATE TABLE UserActivity (
    ActivityID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL,
    ActivityType NVARCHAR(50) NOT NULL,
    Timestamp DATETIME DEFAULT GETDATE(),
    Details NVARCHAR(MAX),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE ServiceRooms (
    ServiceID INT NOT NULL,
    RoomID INT NOT NULL,
    PRIMARY KEY (ServiceID, RoomID),
    FOREIGN KEY (ServiceID) REFERENCES Services(ServiceID) ON DELETE CASCADE,
    FOREIGN KEY (RoomID) REFERENCES Rooms(RoomID) ON DELETE CASCADE
);

CREATE TABLE Visits (
    VisitID INT PRIMARY KEY IDENTITY(1,1),
    UserHash NVARCHAR(64) NOT NULL UNIQUE, 
    FirstVisitDate DATETIME NOT NULL DEFAULT GETDATE(),
    LastVisitDate DATETIME NOT NULL DEFAULT GETDATE() 
);

CREATE TABLE Employees (
    EmployeeID INT PRIMARY KEY IDENTITY(1,1),
    FullName NVARCHAR(100) NOT NULL,
    Position NVARCHAR(100),
    HireDate DATE DEFAULT GETDATE()
);

-- Добавляем внешний ключ в таблицу Rooms
ALTER TABLE Rooms
ADD EmployeeID INT;

ALTER TABLE Rooms
ADD CONSTRAINT FK_Rooms_Employees FOREIGN KEY (EmployeeID)
REFERENCES Employees(EmployeeID);



-- Начальные данные
INSERT INTO Roles (RoleName) VALUES 
('Admin'), 
('User');

INSERT INTO Categories (CategoryName) VALUES 
('Запись'),
('Сведение и мастеринг'),
('Аренда студии'),
('Обучение');

INSERT INTO Services (CategoryID, ServiceName, Description, BaseColor) VALUES 
(1, 'Запись вокала', 'Профессиональная запись вокала в студии', '#FF5733'),
(1, 'Запись инструментов', 'Запись гитары, барабанов, клавишных и других инструментов', '#33FF57'),
(2, 'Сведение трека', 'Сведение многодорожечной записи', '#3357FF'),
(2, 'Мастеринг трека', 'Финальная обработка трека для выпуска', '#FF33A1'),
(3, 'Аренда студии для репетиций', 'Аренда студии для репетиций группы', '#A133FF'),
(3, 'Аренда студии для записи', 'Аренда студии для звукозаписи', '#33FFF5'),
(4, 'Курс по звукозаписи', 'Обучение основам звукозаписи и работы в студии', '#F5FF33'),
(4, 'Курс по сведению', 'Обучение сведению и мастерингу', '#FF3333');

INSERT INTO Rooms (RoomName, Capacity, IsAvailable) VALUES 
('Основная студия', 5, 1),
('Малая студия', 3, 1),
('Зал для репетиций', 10, 1),
('Студия звукозаписи', 2, 1);

INSERT INTO ServiceRooms (ServiceID, RoomID) VALUES 
(1, 1),
(2, 1),
(3, 2),
(4, 2),
(5, 3),
(6, 4);



