import React, { useState, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import './App.css';
import MembersTable from './MembersTable.js';
import HouseholdsTable from './HouseholdsTable.js';
import ServicesTable from './ServicesTable.js'
import TransactionsTable from './TransactionsTable.js'
import QuerySelector from './QuerySelector.js'


const loadMembers = (scope) => {
  return fetch(`http://localhost:8000/api/Members?scope=${scope}`, {
    // credentials: 'include',
    mode: 'cors'
  });
}

const loadHouseholds = (scope) => {
  return fetch(`http://localhost:8000/api/Households?scope=${scope}`, {
    // credentials: 'include',
    mode: 'cors'
  });
}

function App() {

  const [members, setMembers] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [services, setServices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [usePagination, setUsePagination] = useState(true);
  const [scope, setScope] = useState('active');
  const [resultsReady, setResultsReady] = useState(false)

  const queries = [
    {label: "Birthdays", val:"birthdays"},
    {label: "Members by Status", val:"members_by_status"},
    {label: "Members by Age", val:"members_by_age"},
    {label: "Members by Name", val:"members_by_name"},
    {label: "Transactions for Statstics", val:"transactions"},
    {label: "Baptisms", val:"baptisms"},

  ]
 
  const extractServices = members => {
    let services = [];
    members.forEach(m => {
      if (m.services.length) {
        m.services.forEach(service => {
          service.name = m.full_name;
          services.push({...service});
        });
      }
    })
    return services;
  }

  const extractTransactions = members => {
    let transactions = [];
    members.forEach(m => {
      if (m.transactions.length) {
        m.transactions.forEach(transaction => {
          transaction.name = m.full_name;
          transactions.push({...transaction});
        });
      }
    })
    return transactions;
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
    loadMembers(scope)
    .then(res => {
      if (res.json) {
        //Data came from server
        res.json()
        .then(json => {
          //replacec household ID with household object
          let members= json.map(member => {
            let household = {};
            households.forEach( h => {
              if (h.id === member.household) {
                household = h
              }
            });
            member.household = household;
            return member;
          });
          let services = extractServices(members);
          let transactions = extractTransactions(members)
          setMembers(members);
          setServices(services);
          setTransactions(transactions)
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
  }, [households, scope]);
  
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
                <Tab>Transactions</Tab>
                <Tab>Services</Tab>
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
              <TabPanel>
                <TransactionsTable
                  data={transactions}
                  usePagination={usePagination}
                />
              </TabPanel>
              <TabPanel>
                <ServicesTable
                  data={services}
                  usePagination={usePagination}
                />
              </TabPanel>
            </Tabs>
          </TabPanel>
          <TabPanel>
            <div>
              <QuerySelector queries={queries} data={members} resultsReady={resultsReady} setResultsReady={setResultsReady} />
            </div>
          </TabPanel>
        </Tabs>
      </div>
   
  );
}

export default App;
