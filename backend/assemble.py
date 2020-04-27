import json
import datetime
import os
from os import listdir
from os.path import isfile, join

# Get the list of data files and iterate through them
onlyfiles = [f for f in listdir("data") if isfile(join("data", f))]
onlyfiles.sort()
master_data = {}
for file in onlyfiles:
    path = "data/" + file
    with open(path) as file:
      day_data = json.load(file)
    master_data[day_data["date"]] = day_data

# Now reformat it into the structure the JavaScript needs

# Source and updated date
javascript_output = {}
javascript_output["source"]  = "https://www.michigan.gov/coronavirus"
now = datetime.datetime.now()
now_parts = str(now).split(':')
javascript_output["Updated"]  = now_parts[0] + ':' + now_parts[1]

# StateData
state_data = {}
state_data["series"] = {}
last_date = ''
for day in sorted(master_data):
    state_data["series"][day] = master_data[day]["cases"]["Total"]
    last_date = day
javascript_output["StateData"] = state_data

# CountyData

# First, build the county list
county_data = {}
for county in master_data[last_date]["cases"]:
    if (county != 'Total') and (county != 'Out of State'):
        print(county)
        county_data[county] = {"series": {}}

# Now populate the county list
for day in sorted(master_data):
    for county in county_data:
        if county in master_data[day]["cases"]:
            county_data[county]["series"][day] = master_data[day]["cases"][county]
javascript_output["CountyData"] = county_data

print(json.dumps(javascript_output, indent=1, sort_keys=True))

f = open("../frontend/data.js", "w")
f.write('casesData =  ' + json.dumps(javascript_output, indent=1, sort_keys=True))
f.close()
