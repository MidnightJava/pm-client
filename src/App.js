import React, { useState, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import './App.css';
import MembersTable from './MembersTable.js';
import HouseholdsTable from './HouseholdsTable.js';

const NO_SERVER = false;

const loadMembers = (scope) => {

  if (NO_SERVER) {
    try {
      let members = require('../members.json');
      return Promise.resolve(members)
    } catch(e) {
      alert("You're running in NO_SERVER mode, and there is no members.json file");
    }
  } else {
    return fetch(`http://localhost:8000/api/Members?scope=${scope}`, {
      // credentials: 'include',
      mode: 'cors'
    });
  }
}

const loadHouseholds = (scope) => {

  if (NO_SERVER) {
    try {
      let members = require('../households.json');
      return Promise.resolve(members)
    } catch(e) {
      alert("You're running in NO_SERVER mode, and there is no households.json file");
    }
  } else {
    return fetch(`http://localhost:8000/api/Households?scope=${scope}`, {
      // credentials: 'include',
      mode: 'cors'
    });
  }
}

function App() {

  const [members, setMembers] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [usePagination, setUsePagination] = useState(true);
  const [scope, setScope] = useState('active');

  const getHousehold = (id) => {
    let household = {};
    households.forEach( h => {
      if (h.id === id) {
        household = h
      }
    });
    return household;
  };

  const retrieveMembers = () => {
    loadMembers(scope)
    .then(res => {
      if (res.json) {
        //Data came from server
        res.json()
        .then(json => {
          //replacec household ID with household object
          let memb = json.map(_mem => {
            _mem.household = getHousehold(_mem.household);
            return _mem;
          });
          setMembers(memb);
        })
        .catch(err => {
          console.log(`Error ${err}`)
        })
      } else {
        let data = res.filter(x => x);
        if (scope === 'active') {
          data = data.filter(m => m.is_active);
        }
        setMembers(data);
      }
    });
  }

  useEffect(() => {
    loadHouseholds(scope)
    .then(res => {
      if (res.json) {
        //Data came from server
        res.json()
        .then(json => {
          setHouseholds(json);
        });
      } else {
        let data = res.filter(x => x);
        if (scope === 'active') {
          data = data.filter(h => h.head.is_active);
        }
        setHouseholds(data);
      }
    });
  }, [scope])

  useEffect(() => {
    retrieveMembers();
  }, [households]);
  
  return (
      <div className="App">
        <div className="my-2">
          <center><h2>Peri Meleon Demo</h2></center>
        </div>
        <Tabs>
          <TabList>
              <Tab>View and Edit</Tab>
              <Tab>Queries</Tab>
          </TabList>
          <TabPanel>
            <div id="checkbox-panel" className="ml-3 mt-2 mb-3"> 
              <input type="checkbox"
                onClick={(e) => setUsePagination(e.target.checked)}
                defaultChecked={usePagination}
              /> Paginate
              <input type="checkbox" className="ml-3"
                onClick={(e) => setScope(e.target.checked ? 'active' : 'all')}
                defaultChecked={scope === 'active'}
              /> Show Active Members Only
            </div>
            <Tabs>
              <TabList>
                <Tab>Members</Tab>
                <Tab>Households</Tab>
              </TabList>
              <TabPanel>
                <MembersTable
                  data={members}
                  usePagination={usePagination}
                />
              </TabPanel>
              <TabPanel>
                <HouseholdsTable
                  data={households}
                  usePagination={usePagination}
                />
              </TabPanel>
            </Tabs>
          </TabPanel>
          <TabPanel></TabPanel>
        </Tabs>
      </div>
   
  );
}

export default App;
