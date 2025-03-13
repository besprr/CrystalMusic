CREATE DATABASE CrystalMusic

USE CrystalMusic

-- Создание таблицы ролей
CREATE TABLE Roles (
    RoleID INT PRIMARY KEY IDENTITY(1,1),
    RoleName NVARCHAR(50) NOT NULL UNIQUE
);

-- Создание таблицы пользователей
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    RoleID INT NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    RegistrationDate DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);

-- Таблица для хранения refresh токенов
CREATE TABLE RefreshTokens (
    TokenID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL,
    Token NVARCHAR(512) NOT NULL UNIQUE,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    ExpiresAt DATETIME NOT NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Таблица категорий услуг
CREATE TABLE Categories (
    CategoryID INT PRIMARY KEY IDENTITY(1,1),
    CategoryName NVARCHAR(100) NOT NULL UNIQUE
);

-- Таблица услуг студии
CREATE TABLE Services (
    ServiceID INT PRIMARY KEY IDENTITY(1,1),
    CategoryID INT NOT NULL,
    ServiceName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    BaseColor NVARCHAR(7) NOT NULL DEFAULT '#FFFFFF', -- HEX-цвет для градации
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);

-- Таблица помещений
CREATE TABLE Rooms (
    RoomID INT PRIMARY KEY IDENTITY(1,1),
    RoomName NVARCHAR(100) NOT NULL,
    Capacity INT NOT NULL CHECK (Capacity > 0),
    IsAvailable BIT NOT NULL DEFAULT 1
);

-- Таблица бронирований
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

-- Таблица для сбора статистики активности
CREATE TABLE UserActivity (
    ActivityID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL,
    ActivityType NVARCHAR(50) NOT NULL,
    Timestamp DATETIME DEFAULT GETDATE(),
    Details NVARCHAR(MAX),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- Связь услуг и помещений (многие-ко-многим)
CREATE TABLE ServiceRooms (
    ServiceID INT NOT NULL,
    RoomID INT NOT NULL,
    PRIMARY KEY (ServiceID, RoomID),
    FOREIGN KEY (ServiceID) REFERENCES Services(ServiceID) ON DELETE CASCADE,
    FOREIGN KEY (RoomID) REFERENCES Rooms(RoomID) ON DELETE CASCADE
);

CREATE TABLE Visits (
    VisitID INT PRIMARY KEY IDENTITY(1,1),
    UserHash NVARCHAR(64) NOT NULL UNIQUE, -- Хэш IP-адреса или уникальный идентификатор
    FirstVisitDate DATETIME NOT NULL DEFAULT GETDATE() -- Дата первого посещения
);

-- Начальные данные: роли
INSERT INTO Roles (RoleName) VALUES 
('Admin'), 
('User');

-- Индексы для оптимизации
CREATE INDEX IX_Bookings_Time ON Bookings (StartTime, EndTime);
CREATE INDEX IX_Services_Color ON Services (BaseColor);