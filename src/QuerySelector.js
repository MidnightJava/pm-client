import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import QueryResultsTable from './QueryResultsTable';
import styled from 'styled-components';
import { Textbox } from 'react-inputs-validation';
const moment = require('moment')

const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;

const Styles = styled.div`
  .bold {
    font-weight: bold;
  }
`

export const STATUS_TYPES = {
    COMMUNING: "COMMUNING",
    NONCOMMINING: "NONCOMMUNING",
    EXCOMMUNICATED: "EXCOMMUNICATED",
    SUSPENDED: "SUSPENDED",
    DISMISSAL_PENDING: "DISMISSAL_PENDING",
    DISMISSED: "DISMISSED",
    REMOVED: "REMOVED",
    DEAD: "DEAD",
    PASTOR: "PASTOR",
    VISITOR: "VISITOR"
};

const downloadFile = (name, contents) => {
    const a = document.createElement("a");
    const file = new Blob([contents], {type: 'text/plain'});
    a.href = URL.createObjectURL(file);
    a.download = name;
    document.body.appendChild(a); // Required for this to work in FireFox
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(a.href);
     });
}
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

const formatHdr = hdr => {
    let parts = hdr.split('_').map(part => part[0].toUpperCase() + part.slice(1));
    return parts.join(" ");
}


const makeCsvFile = (headers, rows) => {
    const csvStringifier = createCsvStringifier({
        header: headers.map(hdr => ({id: hdr, title: formatHdr(hdr)}))
    });
    console.log(csvStringifier.getHeaderString());
    rows = rows.map(row => {
        let obj = {}
        headers.forEach(hdr => {
            obj[hdr] = row.values[hdr];
        })
        return obj;
    });
    console.log(csvStringifier.stringifyRecords(rows))
    return csvStringifier.getHeaderRecord() + "\n" + csvStringifier.stringifyRecords(rows)
}

function QuerySelector({queries, data, usePagination, resultsReady, setResultsReady}) { 

    const [queryType, setQueryType] = useState(null)
    const [query, setQuery] = useState(null);
    const [filteredRows, setFilteredRows] = useState([]);
    const [clipboardStatus, setClipboardStatus] = useState('');
    const [validateDate, setValidateDate] = useState(false);
    const [ageDateValid, setAgeDateValid] = useState(true)
    const [transFromDateValid, setTransFromDateValid] = useState(true);
    const [transToDateValid, setTransToDateValid] = useState(true);
    const [baptismFromDateValid, setBaptismFromDateValid] = useState(true);
    const [baptismToDateValid, setBaptismToDateValid] = useState(true);
    const [asOfDate, setAsOfDate] = useState(moment().format("YYYY-MM-DD"));
    const [transFromDate, setTransFromDate] = useState(moment().year(moment().year() - 1).format("YYYY-MM-DD"));
    const [transToDate, setTransToDate] = useState(moment().format("YYYY-MM-DD"));
    const [baptismFromDate, setBaptismFromDate] = useState(moment().year(moment().year() - 1).format("YYYY-MM-DD"));
    const [baptismToDate, setBaptismToDate] = useState(moment().format("YYYY-MM-DD"));
    const [status, setStatus] = useState("COMMUNING");
    const [nameString, setNameString] = useState("");
    let birthMonthSelect = React.createRef();
    let opSelect = React.createRef();
    let ageInp = React.createRef();
    let residentCB = React.createRef();
    let nonResidentCB = React.createRef();

    const columnMap = {
        birthdays: ['full_name', 'date_of_birth'],
        members_by_age: ['full_name', "sex", "status", "date_of_birth", "age", 'date_last_change'],
        members_by_status: ['full_name', 'status', 'transaction_date', 'transaction_type', 'transaction_authority',
        'transaction_church', 'transaction_comment','date_last_change'],
        members_by_name: ['full_name', "sex", "status", "date_of_birth", 'date_last_change'],
        transactions_for_stats: ['full_name', 'transaction_type', 'date_last_change', 'status'],
        baptisms: ['full_name', 'baptism']
    };



    const queryPanes = {};

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
            <select ref={el => birthMonthSelect = el}>
                {moment.months().map( (m, idx) => {
                    return (
                        <option key={idx} value={m}>
                            {m}
                        </option>
                    )
                })}
            </select>
            <div className="mt-2">
                <Button className="btn btn-primary"
                    onClick={() => {
                        setQuery({type: queryType, month: birthMonthSelect.value.toLowerCase()});
                        setClipboardStatus('');
                    }}
                >Execute</Button>
            </div>
            <div className="mt-2">
                <Button disabled={!resultsReady}
                    className="mr-2 btn btn-primary"
                    onClick={() => copyToClipboard(formatBirthdayResults(filteredRows))}
                >Copy Results</Button>
                <Button disabled={!resultsReady}
                    className="btn btn-primary"
                    onClick={() => downloadFile('members_birthdays.txt', formatBirthdayResults(filteredRows))}
                >Export to File</Button>
            </div>
            <div className="mt-2">{clipboardStatus}</div>
        </div>
    );

    queryPanes.members_by_age = (
        <div>
            <div className="mb-2">Show members whose age as of</div>
            <Textbox classNameWrapper="mr-2"
                attributesInput={{
                    id: "Name",
                    name: "ageAsOfText",
                    type: "text",
                    placeholder: "YYYY-MM-DD"
                }}
                customStyleInput={ageDateValid ? {} : {border:"solid red"}}
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
                        setAgeDateValid(false)
                        return '';
                      }
                      setAgeDateValid(true)
                      return true;
                    }
                }}
            />is 
            <select className="ml-2 mt-2" ref={el => opSelect = el}>
                {["less than", "less than or equal to", "greater than", "greater than or equal to", "equal to"].map((comp, idx) => {
                    return <option key={idx} value={comp.replace(/ /g, '_')}>{comp}</option>
                })}
            </select>
            <input className="ml-2" type="number" ref={el => ageInp = el} size={2} defaultValue={5} /> years
            <div className="mt-2">
                <Button className="btn btn-primary"
                    disabled={!ageDateValid}
                    onClick={() => {
                        setQuery({type: queryType, asOfDate, op: opSelect.value, age: ageInp.value});
                        setClipboardStatus('');
                    }}
                >Execute</Button>
            </div>
            <div className="mt-2">
                <Button disabled={!resultsReady}
                    className="mr-2 btn btn-primary"
                    onClick={() => copyToClipboard(makeCsvFile(columnMap[queryType], filteredRows))}
                >Copy Results</Button>
                <Button disabled={!resultsReady}
                    className="btn btn-primary"
                    onClick={() => downloadFile('members_by_age.csv', makeCsvFile(columnMap[queryType], filteredRows))}
                >Export to File</Button>
            </div>
            <div className="mt-2">{clipboardStatus}</div>
        </div>
    );

    queryPanes.members_by_status = (
        <div>
             <div className="mb-2">Show members with the following status:</div>
             <select
                onClick = {e => {
                    setStatus(e.target.value);
                }}
             >
                {Object.values(STATUS_TYPES).map( (s, idx) => {
                    return (
                        <option key={idx} value={s}>
                            {s}
                        </option>
                    )
                })}
            </select>
            {status === STATUS_TYPES.COMMUNING ? (
            <div id="checkbox-panel" className="ml-3 mt-2 mb-3"> 
                <input type="checkbox"
                defaultChecked="checked"
                ref = {el => residentCB = el}
                /> Resident
                <input type="checkbox" className="ml-3"
                ref = {el => nonResidentCB = el}
                /> Non Resident
            </div>) :
            null}
            <div className="mt-2">
                <Button className="btn btn-primary"
                    onClick={() => {
                        setQuery({type: queryType, status, resident: residentCB.checked, nonResident: nonResidentCB.checked})
                        setClipboardStatus('');
                    }}
                >Execute</Button>
            </div>
            <div className="mt-2">
                <Button disabled={!resultsReady}
                    className="mr-2 btn btn-primary"
                    onClick={() => copyToClipboard(makeCsvFile(columnMap[queryType], filteredRows))}
                >Copy Results</Button>
                <Button disabled={!resultsReady}
                    className="btn btn-primary"
                    onClick={() => downloadFile('members_by_status.csv', makeCsvFile(columnMap[queryType], filteredRows))}
                >Export to File</Button>
            </div>
            <div className="mt-2">{clipboardStatus}</div>
        </div>
    );

    queryPanes.members_by_name = (
        <div>
            <div className="mb-2">Enter name string to search for</div>
            <input type="text" onInput={e => setNameString(e.target.value)} />
            <div className="mt-2">
                <Button className="btn btn-primary"
                    onClick={() => {
                        setQuery({type: queryType, nameString});
                        setClipboardStatus('');
                    }}
                >Execute</Button>
            </div>
            <div className="mt-2">
                <Button disabled={!resultsReady}
                    className="mr-2 btn btn-primary"
                    onClick={() => copyToClipboard(makeCsvFile(columnMap[queryType], filteredRows))}
                >Copy Results</Button>
                <Button disabled={!resultsReady}
                    className="btn btn-primary"
                    onClick={() => downloadFile('members_by_name.csv',  makeCsvFile(columnMap[queryType], filteredRows))}
                >Export to File</Button>
            </div>
            <div className="mt-2">{clipboardStatus}</div>
        </div>
    );

    queryPanes.transactions_for_stats = (
        <div>
            <div className="mb-2">Show transactions with dates</div>
            <span>from
            <Textbox classNameWrapper="ml-2 mr-2"
                attributesInput={{
                    id: "Name",
                    name: "transFromDate",
                    type: "text",
                    placeholder: "YYYY-MM-DD"
                }}
                customStyleInput={transFromDateValid ? {} : {border:"solid red"}}
                customStyleContainer={{display: 'inline', "white-space": 'nowrap'}}
                customStyleWrapper={{display: 'inline', "white-space": 'nowrap'}}
                value={transFromDate}
                validate={true}
                onKeyUp={e => {
                    setValidateDate(true)
                }}
                onBlur={e => {
                    setTransFromDate(e.target.value);
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
                        setTransFromDateValid(false)
                        return '';
                      }
                      setTransFromDateValid(true)
                      return true;
                    }
                }}
            />to 
            <Textbox classNameWrapper="ml-2"
                attributesInput={{
                    id: "Name",
                    name: "transToDate",
                    type: "text",
                    placeholder: "YYYY-MM-DD"
                }}
                customStyleInput={transToDateValid ? {} : {border:"solid red"}}
                customStyleContainer={{display: 'inline', "white-space": 'nowrap'}}
                customStyleWrapper={{display: 'inline', "white-space": 'nowrap'}}
                value={transToDate}
                validate={true}
                onKeyUp={e => {
                    setValidateDate(true)
                }}
                onBlur={e => {
                    setTransToDate(e.target.value);
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
                        setTransToDateValid(false)
                        return '';
                      }
                      setTransToDateValid(true)
                      return true;
                    }
                }}
            />
            </span>
            <div className="mt-2">
                <Button className="btn btn-primary"
                    disabled={!transFromDateValid || !transToDateValid}
                    onClick={() => {
                        setQuery({type: queryType, transFromDate, transToDate});
                        setClipboardStatus('');
                    }}
                >Execute</Button>
            </div>
            <div className="mt-2">
                <Button disabled={!resultsReady}
                    className="mr-2 btn btn-primary"
                    onClick={() => copyToClipboard(makeCsvFile(columnMap[queryType], filteredRows))}
                >Copy Results</Button>
                <Button disabled={!resultsReady}
                    className="btn btn-primary"
                    onClick={() => downloadFile('transactions_for_stats.csv', makeCsvFile(columnMap[queryType], filteredRows))}
                >Export to File</Button>
            </div>
            <div className="mt-2">{clipboardStatus}</div>
        </div>
    );

    queryPanes.baptisms = (
        <div>
            <div className="mb-2">Show baptisms with dates</div>
            <span>from
            <Textbox classNameWrapper="ml-2 mr-2"
                attributesInput={{
                    id: "Name",
                    name: "baptismFromDate",
                    type: "text",
                    placeholder: "YYYY-MM-DD"
                }}
                customStyleInput={baptismFromDateValid ? {} : {border:"solid red"}}
                customStyleContainer={{display: 'inline', "white-space": 'nowrap'}}
                customStyleWrapper={{display: 'inline', "white-space": 'nowrap'}}
                value={baptismFromDate}
                validate={true}
                onKeyUp={e => {
                    setValidateDate(true)
                }}
                onBlur={e => {
                    setBaptismFromDate(e.target.value);
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
                        setBaptismFromDateValid(false)
                        return '';
                      }
                      setBaptismFromDateValid(true)
                      return true;
                    }
                }}
            />to 
            <Textbox classNameWrapper="ml-2"
                attributesInput={{
                    id: "Name",
                    name: "baptismToDate",
                    type: "text",
                    placeholder: "YYYY-MM-DD"
                }}
                customStyleInput={baptismToDateValid ? {} : {border:"solid red"}}
                customStyleContainer={{display: 'inline', "white-space": 'nowrap'}}
                customStyleWrapper={{display: 'inline', "white-space": 'nowrap'}}
                value={baptismToDate}
                validate={true}
                onKeyUp={e => {
                    setValidateDate(true)
                }}
                onBlur={e => {
                    setBaptismToDate(e.target.value);
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
                        setBaptismToDateValid(false)
                        return '';
                      }
                      setBaptismToDateValid(true)
                      return true;
                    }
                }}
            />
            </span>
            <div className="mt-2">
                <Button className="btn btn-primary"
                    disabled={!baptismFromDateValid || !baptismToDateValid}
                    onClick={() => {
                        setQuery({type: queryType, baptismFromDate, baptismToDate});
                        setClipboardStatus('');
                    }}
                >Execute</Button>
            </div>
            <div className="mt-2">
                <Button disabled={!resultsReady}
                    className="mr-2 btn btn-primary"
                    onClick={() => copyToClipboard(makeCsvFile(columnMap[queryType], filteredRows))}
                >Copy Results</Button>
                <Button disabled={!resultsReady}
                    className="btn btn-primary"
                    onClick={() => downloadFile('transactions_for_stats.csv', makeCsvFile(columnMap[queryType], filteredRows))}
                >Export to File</Button>
            </div>
            <div className="mt-2">{clipboardStatus}</div>
        </div>
    );


    const getQueryPane = function(queryType) {
        return queryPanes[queryType];
    }

    const resetQueryValues = function() {
        setAsOfDate(moment().format("YYYY-MM-DD"));
        setTransFromDate(moment().year(moment().year() - 1).format("YYYY-MM-DD"));
        setTransToDate(moment().format("YYYY-MM-DD"));
        setBaptismFromDate(moment().year(moment().year() - 1).format("YYYY-MM-DD"));
        setBaptismToDate(moment().format("YYYY-MM-DD"));
        setStatus("COMMUNING");
        setNameString("");
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
                                            resetQueryValues()
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
                    usePagination={usePagination}
                    filter={query}
                    columnMap={columnMap}
                    setResultsReady={setResultsReady}
                    setFilteredRows={setFilteredRows} />:
            null}
        </Styles>
    )
}

export default QuerySelector;