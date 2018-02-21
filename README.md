# survey-builder

When finished this program will allow users to build and maintain a survey in a web browser.

Notes for installing.

1. Install node.js on your computer.
2. Install a mySQL database on your computer.  
3. `npm install mysql` in the command line.
4. `npm install express` in the command line.
5. `npm install formidable` in the command line.
6. `npm install nodemailer` in the command line.
7. `npm install config.json` in the command line.
8. Rename config_template.json in the lib folder to config.json and put in your db information and email information.  If it is named config.json the .gitignore file will force github to ignore the file and your db login information will be kept private.
9. Run the lib/createDB.sql and it will create the tables necessary to create users, the user name created at default is "admin" with a password of "ABC123", you can change this from the admin button on the dashboard page.
10. You are now read to create surveys!
