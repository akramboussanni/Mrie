# 📦 MRIE - Multipurpose Repository of Internet-accessible Essentials

🌐 **Live Site**: [mrie.dev](https://mrie.dev)
Made with **C#**, **ASP.NET**, **MudBlazor**

MRIE is a multipurpose web platform built to replace clunky, proprietary, or non-extensible tools with developer-friendly, self-hosted solutions.

## 🛠️ Tech Stack

- Built purely with **C#** and **razor pages**
- **MudBlazor** for pretty UI
- **ASP.NET Core** (.NET 9) + Identity
- **SignalR** for real-time updates  
- **EF Core** for database access
- Modular, extensible APIs


---

## 📱 Mobile Support
MRIE is designed with mobile-first principles. Since over **50% of web traffic** is from mobile, the interface automatically adapts to smaller screens for an optimal experience.

---

## ⚙️ Config Panel
A full-featured configuration system available to admins.

- Create & manage users  
- Assign fine-grained permissions  
- 🛠Configure individual features  
- Modular and easy to use

---

## 🤖 Lab AI
An assistant tailored for Québec's Secondary education system, specifically to help with lab reports.

- Powered by `GPT-4.1 mini`  
- Prompts are customizable in the config  
- Real-time updates via SignalR  
- Labs are stored and reusable in DB

---

## 🕋 Prayer Times Scraper
Scrapes data from [Mawaqit](https://mawaqit.net) and exposes it via a public API.

- Converts times to UTC  
- Reliable fallback when no API is exposed  
- 🔗 [View Times](https://mrie.akramb.com/prayertimes/default)

---

## 🎥 Zorro - Media Ripper
Zorro is a scalable media fetcher and downloader.

- Supports YouTube, TikTok, Instagram, and more  
- Automatically selects the best backend  
- **Installs required binaries** at startup  
- Modular and **scalable**

---

## 🔗 URL Shortener
Create redirect links quickly via the config panel.

Example:  
`https://mrie.akramb.com/test` → `https://google.com`

---

## 🔐 Authentication & Access Control

- Uses **.NET Identity** with secure hashed passwords  
- Custom permission system via enum flags  
- MRIE codebase includes base controllers like `MrieController`, `CrudController`

### 🔑 Access Tokens
Tokens can be used to access certain endpoints without login.

- Set via `X-Mrie-Token` header
- Randomly generated, stored as SHA-256
- Configurable expiry, name, description, and permissions

---

## 📝 Signups *(WIP)*
Designed to simplify volunteer coordination, events, or potlucks.

- Users sign up for roles  
- Protected against unauthorized edits  
- Useful for work events, shifts, or shared responsibilities

---

## 🎉 Watch Parties *(WIP)*
Watch videos in sync with friends online.

- One host controls playback  
- Guests follow along in real-time  
- Perfect for virtual movie nights or study groups

---
