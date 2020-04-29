import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import PMTable from './PMTable.js';

const NO_SERVER = true;

const loadMembers = (scope) => {

  if (NO_SERVER) {
    try {
      let members = require('../members.json');
      return Promise.resolve(members)
    } catch(e) {
      alert("You're running in NO_SERVER mode, and there is no members.json file");
    }
  } else {
    return fetch(`http://db:8000/api/getMembers?scope=${scope}`, {
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
    return fetch(`http://db:8000/api/getHouseholds?scope=${scope}`, {
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

  useEffect(() => {
    loadMembers(scope)
    .then(res => {
      if (res.json) {
        //Data came from server
        res.json()
        .then(json => {
          setMembers(json);
        });
      } else {
        let data = res.filter(x => x);
        if (scope === 'active') {
          data = data.filter(m => m.is_active);
        }
        setMembers(data);
      }
    });
  }, [scope])

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

  const getHousehold = id => {
    let household = null;
    households.forEach( h => {
      if (h.id === id) {
        household = h
      }
    });
    return household;
  }

  return (
    <div className="App">
      <div >
        <h2>Peri Meleon Demo</h2> 
      </div>
      <div id="paginate" className="mx-auto">
        <input type="checkbox"
          onClick={(e) => setUsePagination(e.target.checked)}
          defaultChecked={usePagination}
        /> Paginate
        <input type="checkbox" className="ml-3"
          onClick={(e) => setScope(e.target.checked ? 'active' : 'all')}
          defaultChecked={scope === 'active'}
        /> Show Active Members Only
      </div>
      <PMTable
        data={useMemo( () => members, [members])}
        usePagination={usePagination}
        getHouseholdCB={getHousehold}
      />
    </div>
  );
}

export default App;
