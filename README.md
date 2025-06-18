# MRIE - Multipurpose Repository of Internet-accessible Essentials
Mrie is a website (hosted @ https://mrie.akramb.com) that contains many features designed to make life easier.
Most of these features were complicated to install, modify, or not open-source, so I wrote my own helpers.

## Authentication
This website supports authentication, with secured passwords with hashing, etc provided by .NET's Identity system. MRIE has it's own permission system, using enum flags, that allows resource-specific access. MRIE's codebase provides helper API controller classes, such as "MrieController" and "CrudController" that streamline the usage of these resources.

On top of this, MRIE offers an "**Access Token**" feature, that allows accessing (some) resources without authentication, by setting it as a header (X-Mrie-Token). Access Tokens can be made by MRIE admins and can be given specific permissions, an expiry date, name, description. Access tokens are hashed using the SHA-256 algorithm to ensure safety in case of a db leak.

## Mobile Support
MRIE cares about mobile devices, since it represents over **50% of Internet traffic**. MRIE's UI automatically changes to fit Mobile better for the best user experience. :)

## Config
MRIE has a very comprehensive config section, accessible only to admins. Each feature requires different permissions to configure, and are easy and understandable to change. It offers a way to assign permissions to users, create new users, and change feature-specific configs for MRIE.

## Lab AI
This is an **AI assistant** with `GPT-4.1 mini` designed to greatly simplify the process to make lab reports. It is designed for Québec's education system, at the Secondary level, following all the criteria necessary. In the case that the AI doesn't fit your needs, the prompts are changeable by config. Lab AI uses SignalR to provide realtime updates on the generation, and generations are stored in DB for future use or even sharing.

## Prayer Times Scraper
MRIE also offers an API for the "Mawaqit" app. This app does not expose a front-facing API, so MRIE `scrapes` the Mawaqit page, converts the time properly to UTC and returns it in an API. MRIE also has a page to view these times @ https://mrie.akramb.com/prayertimes/default

## Zorro
Zorro is a media ripper that allows to fetch information about a video, or download it from many websites that do not allow this: YouTube, Instagram, TikTok, and many more. Zorro was designed with **scalability** in mind; it supports many downloaders, auto-registered on boot, and finds the best downloader fit. It even automatically installs the required binaries to download these services.

## URL Shortener
MRIE provides a URL shortener feature (accessible on the config page) that allows creating unique links that redirect to another. For example, setting a URL shortener with the name "`test`" and value of "`https://google.com`" would cause `https://mrie.akramb.com/test` to redirect to `https://google.com`

## Signups (WIP)
Signups is an in-progress feature dedicated to helping with volunteering and such. Instead of using confusing Excel files, volunteers can sign up for a role on a Signup, which handles security and doesn't allow someone to delete everything. It can be used for many other cases, for example, a work potluck, where everyone can tell other people in advance what they will bring!

## Watch Parties (WIP)
Watch Parties allow you and your friend to watch video media in sync. One person, designed the host, can control the video's speed, seek, etc., and everyone can watch at the same time. It's like you're all in the same room!
