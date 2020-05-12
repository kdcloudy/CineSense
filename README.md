# CineSense
The ongoing implementation of CineSense, an online movie database application built using node.js and user preferences are recorded in a custom database using Mongodb Atlas.
Authentication handled using Passport.js
Movie data pulled through the OMdb API (key required)
Watch (availability in streaming services like Netflix and Prime Video) data pulled through the uTelly API (key required)

Known Issues:
- Watch data mismatch for certain titles
- Posters missing for certain titles
- Watch data returns results only for Indian region
- No custom UI error pages or messages
