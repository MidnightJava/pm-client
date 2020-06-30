# pm-client
React Client for Church Membership Database (Peri Meleon)

# Overview
This is a very early prototype of a client UI for PM-Web. It provides some viewing capabilities which illustrate the ability of react-table to render, filter, sort, and group data records. It does not provide any capabilities for modifying data.

# Pre-Requesite
Install [pm_http_server](https://github.com/fkuhl/pm_http_server), populate it with data, and run the server on port 8000.

# Install
git clone git@github.com:MidnightJava/pm-client.git
cd pm-client
npm install

# Run
npm start
Define env variable BROWSER to launch the browser automatically. Otherwise, point your browser to http://localhost:3000

# Use
Use the check boxes to switch between paginated and non-paginated table representation and to show all members or only active members.
Click the Help button on each View tab for information on filtering, sorting, and grouping.
