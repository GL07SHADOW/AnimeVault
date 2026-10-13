# 🛠️ AnimeVault — Local Setup Guide

Follow these steps to run AnimeVault on your own machine.

---

## 📋 Prerequisites

| Tool | Version | Download |
|---|---|---|
| XAMPP | 8.2+ | https://www.apachefriends.org/ |
| Web browser | Any modern | Chrome, Firefox, Edge |

XAMPP includes Apache, PHP 8.2, MySQL, and phpMyAdmin — all in one package.

---

## 🚀 Step 1 — Install XAMPP

1. Download XAMPP for your OS
2. Install it (defaults are fine)
3. Launch **XAMPP Control Panel**
4. Start **Apache** and **MySQL**

---

## 📁 Step 2 — Place the Project

Move the `AnimeVault/` folder into your XAMPP htdocs directory:

| OS | Path |
|---|---|
| Windows | `C:\xampp\htdocs\AnimeVault\` |
| macOS | `/Applications/XAMPP/htdocs/AnimeVault/` |
| Linux | `/opt/lampp/htdocs/AnimeVault/` |

---

## 🗄️ Step 3 — Create the Database

1. Open **http://localhost/phpmyadmin/**
2. Click **Import** in the top tab
3. Choose the `database.sql` file from the project root
4. Click **Go**

**Expected:** 4 tables created — `users`, `anime`, `sessions`, `watchlist`

---

## ⚙️ Step 4 — Verify Database Credentials

Open `backend/config/database.php` and confirm:

```php
$host     = "localhost";
$dbname   = "animevault";
$username = "root";
$password = "";  // XAMPP default is empty