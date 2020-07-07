import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import QueryResultsTable from './QueryResultsTable';
import styled from 'styled-components';
const moment = require('moment')

const Styles = styled.div`
  .bold {
    font-weight: bold;
  }
`

const formatBirthdayResults = rows => {
    let s = "";
    let firstRow = false
    rows = rows.sort((r1, r2) => {
        return moment(r1.values.date_of_birth).date() - moment(r2.values.date_of_birth).date();
    });
    rows.forEach(row => {
        s+= firstRow ? ", " : "";
        firstRow = true;
        s+= `${row.original.given_name} ${row.original.family_name} (${moment(row.values.date_of_birth).date()})`;
    });
    return s;
}

const exportResults = rows => {
    let res = formatBirthdayResults(rows);
    console.log(res);
};

function QuerySelector({queries, data, resultsReady, setResultsReady}) { 

    const [queryType, setQueryType] = useState(null)
    const [query, setQuery] = useState(null);
    const [filteredRows, setFilteredRows] = useState([]);
    const [clipboardStatus, setClipboardStatus] = useState('');
    const queryPanes = {};

    let birthdaySelect = React.createRef();

    const copyResults = rows => {
        let res = formatBirthdayResults(rows);
        res.split(', ').forEach(rec => {
            console.log(rec)
        })
        const el = document.createElement('textarea');
        el.value = res;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setClipboardStatus('Results copied to clipboard')
    };

    queryPanes.birthdays = (
        <div>
            <div className="mb-2">Show active members with birthdays in</div>
            <select ref={el => birthdaySelect = el}>
                {moment.months().map( (m, idx) => {
                    return (
                        <option key={idx} valuse={m}>
                            {m}
                        </option>
                    )
                })}
            </select>
            <div className="mt-2">
                <Button className="btn btn-primary"
                    onClick={() => {
                        setQuery({month: birthdaySelect.value.toLowerCase()});
                        setClipboardStatus('');
                    }}
                >Execute</Button>
            </div>
            <div className="mt-2">
                <Button disabled={!resultsReady}
                    className="mr-2 btn btn-primary"
                    onClick={() => copyResults(filteredRows)}
                >Copy Results</Button>
                <Button disabled={!resultsReady}
                    className="btn btn-primary"
                    onClick={() => exportResults(filteredRows)}
                >Export to File</Button>
            </div>
            <div className="mt-2">{clipboardStatus}</div>
        </div>
    );


    const getQueryPane = function(queryType) {
        return queryPanes[queryType];
    }

    return (
        <Styles>
            <div className="row mb-2 pb-2 border-bottom border-secondary">
                <div className="col-md-2 border-right border-secondary">
                    <div className="mt-2 mb-2 bold">Select a query</div>
                        {queries.map((q, idx) => {
                            return (
                                <div key={idx}>
                                    <input className="mt-1 mr-1" type="radio" name="query" value={q.val}
                                        onClick={e => {
                                            setQuery(null);
                                            setResultsReady(false);
                                            setClipboardStatus('');
                                            setQueryType(e.target.value);
                                        }}
                                    />
                                    {q.label}
                                </div>
                            )
                        })}
                </div>
                <div className="col-md">
                    {getQueryPane(queryType)}
                </div>
            </div>
            {query ?
                <QueryResultsTable
                    className="mt-3 pt-3"
                    data={data} 
                    sePagination={true}
                    filter={query}
                    setResultsReady={setResultsReady}
                    setFilteredRows={setFilteredRows} />:
            null}
        </Styles>
    )
}

export default QuerySelector;