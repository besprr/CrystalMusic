DROP DATABASE IF EXISTS CrystalMusic;
GO

CREATE DATABASE CrystalMusic;
GO

USE CrystalMusic;
GO

INSERT INTO Employees (FullName, Position, HireDate) VALUES
('������ ����', '�������������', '2022-01-15'),
('������ ϸ��', '�������������', '2021-07-01'),
('������� �����', '�������������', '2023-03-12'),
('�������� �����', '�������������', '2020-11-05');


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
        '��������� ���������������' -- ������� �������
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

-- ��������� ������� ���� � ������� Rooms
ALTER TABLE Rooms
ADD EmployeeID INT;

ALTER TABLE Rooms
ADD CONSTRAINT FK_Rooms_Employees FOREIGN KEY (EmployeeID)
REFERENCES Employees(EmployeeID);



-- ��������� ������
INSERT INTO Roles (RoleName) VALUES 
('Admin'), 
('User');

INSERT INTO Categories (CategoryName) VALUES 
('������'),
('�������� � ���������'),
('������ ������'),
('��������');

INSERT INTO Services (CategoryID, ServiceName, Description, BaseColor) VALUES 
(1, '������ ������', '���������������� ������ ������ � ������', '#FF5733'),
(1, '������ ������������', '������ ������, ���������, ��������� � ������ ������������', '#33FF57'),
(2, '�������� �����', '�������� ��������������� ������', '#3357FF'),
(2, '��������� �����', '��������� ��������� ����� ��� �������', '#FF33A1'),
(3, '������ ������ ��� ���������', '������ ������ ��� ��������� ������', '#A133FF'),
(3, '������ ������ ��� ������', '������ ������ ��� �����������', '#33FFF5'),
(4, '���� �� �����������', '�������� ������� ����������� � ������ � ������', '#F5FF33'),
(4, '���� �� ��������', '�������� �������� � ����������', '#FF3333');

INSERT INTO Rooms (RoomName, Capacity, IsAvailable) VALUES 
('�������� ������', 5, 1),
('����� ������', 3, 1),
('��� ��� ���������', 10, 1),
('������ �����������', 2, 1);

INSERT INTO ServiceRooms (ServiceID, RoomID) VALUES 
(1, 1),
(2, 1),
(3, 2),
(4, 2),
(5, 3),
(6, 4);



