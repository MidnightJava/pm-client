import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import PMTable from './PMTable.js';

const loadData = (scope) => {
  return fetch(`http://192.168.1.54:8000/api/getMembers?scope=${scope}`, {
    // credentials: 'include',
    mode: 'cors'
  });
}

function App() {

  const [members, setMembers] = useState([]);
  const [usePagination, setUsePagination] = useState(true);
  const [scope, setScope] = useState('active');

  useEffect(() => {
    loadData(scope)
    .then(res => {
      res.json()
      .then(json => {
        setMembers(json);
      });
    });
  }, [members])

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
      />
    </div>
  );
}

export default App;
