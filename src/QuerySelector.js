import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import QueryResultsTable from './QueryResultsTable';
import styled from 'styled-components';
import { Textbox } from 'react-inputs-validation';
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

const exportBirthdayResults = rows => {
    let res = formatBirthdayResults(rows);
    console.log(res);
};

const exportMemberResults = rows => {
    let res = formatBirthdayResults(rows);
    console.log(res);
};

function QuerySelector({queries, data, resultsReady, setResultsReady}) { 

    const [queryType, setQueryType] = useState(null)
    const [query, setQuery] = useState(null);
    const [filteredRows, setFilteredRows] = useState([]);
    const [clipboardStatus, setClipboardStatus] = useState('');
    const [validateDate, setValidateDate] = useState(false);
    const [dateValid, setDateValid] = useState(false)
    const [asOfDate, setAsOfDate] = useState(moment().format("YYYY-MM-DD"));
    let birthdaySelect = React.createRef();
    let opSelect = React.createRef();
    let ageInp = React.createRef();

    const queryPanes = {};

    const copyBirthdayResults = rows => {
        let res = formatBirthdayResults(rows);
        res.split(', ').forEach(rec => {
            console.log(rec)
        })
        copyToClipboard(res)
    };

    const copyMemberResults = () => {

    }

    const copyToClipboard =  res => {
        const el = document.createElement('textarea');
        el.value = res;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setClipboardStatus('Results copied to clipboard')
    }

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
                        setQuery({type: queryType, month: birthdaySelect.value.toLowerCase()});
                        setClipboardStatus('');
                    }}
                >Execute</Button>
            </div>
            <div className="mt-2">
                <Button disabled={!resultsReady}
                    className="mr-2 btn btn-primary"
                    onClick={() => copyBirthdayResults(filteredRows)}
                >Copy Results</Button>
                <Button disabled={!resultsReady}
                    className="btn btn-primary"
                    onClick={() => exportBirthdayResults(filteredRows)}
                >Export to File</Button>
            </div>
            <div className="mt-2">{clipboardStatus}</div>
        </div>
    );

    queryPanes.members_by_age = (
        <div>
            <div className="mb-2">Show members whose age as of</div>
            <Textbox classNameWrapper="mr-2"
                // ref={el => asOfText = el}
                attributesInput={{
                    id: "Name",
                    name: "asOfData",
                    type: "text",
                    placeholder: "YYYY-MM-DD"
                }}
                customStyleInput={dateValid ? {} : {border:"solid red"}}
                value={moment().format("YYYY-MM-DD")}
                validate={true}
                onKeyUp={e => {
                    setValidateDate(true)
                }}
                onBlur={e => {
                    setAsOfDate(e.target.value);
                    setValidateDate(true);
                }}
                validationOption={{
                    name: "Date",
                    check: true,
                    required: false,
                    type: 'string',
                    validate: {validateDate},
                    customFunc: res => {
                      if (!moment(res, "YYYY-MM-DD", true).isValid()) {
                        setDateValid(false)
                        return '';
                      }
                      setDateValid(true)
                      return true;
                    }
                }}
            />is 
            <select className="ml-2" ref={el => opSelect = el}>
                {["less than", "less than or equal to", "greater than", "greater than or equal to", "equal to"].map((comp, idx) => {
                    return <option key={idx} value={comp.replace(/ /g, '_')}>{comp}</option>
                })}
            </select>
            <input className="ml-2" type="number" ref={el => ageInp = el} size={2} defaultValue={5} /> years
            <div className="mt-2">
                <Button className="btn btn-primary"
                    disabled={!dateValid}
                    onClick={() => {
                        setQuery({type: queryType, asOfDate, op: opSelect.value, age: ageInp.value});
                        setClipboardStatus('');
                    }}
                >Execute</Button>
            </div>
            <div className="mt-2">
                <Button disabled={!resultsReady}
                    className="mr-2 btn btn-primary"
                    onClick={() => copyMemberResults(filteredRows)}
                >Copy Results</Button>
                <Button disabled={!resultsReady}
                    className="btn btn-primary"
                    onClick={() => exportMemberResults(filteredRows)}
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