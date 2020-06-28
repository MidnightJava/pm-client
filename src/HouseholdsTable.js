import React, { useMemo, useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import styled from 'styled-components'
import { useTable, usePagination, useFilters, useGlobalFilter, useExpanded, useResizeColumns,
  useBlockLayout, useSortBy } from 'react-table'
import { DefaultColumnFilter, fuzzyTextFilterFn, GlobalFilter} from "./Filters.js"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleDoubleRight } from '@fortawesome/free-solid-svg-icons'
import { faAngleDoubleDown } from '@fortawesome/free-solid-svg-icons'
import HelpModal from './HelpModal.js';


const Styles = styled.div`
  /* This is required to make the table full-width */
  display: block;
  max-width: 100%;

  /* This will make the table scrollable when it gets too small */
  .tableWrap {
    display: block;
    max-width: 100%;
    overflow-x: scroll;
    overflow-y: hidden;
    border-bottom: 1px solid black;
  }

  table {
    /* Make sure the inner table is always as wide as needed */
    width: 100%;
    border-spacing: 0;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;
      position: relative;


      /* The secret sauce */
      /* Each cell should grow equally */
      width: 1%;
      /* But "collapsed" cells should be as small as possible */
      &.collapse {
        width: 0.0000000001%;
      }

      :last-child {
        border-right: 0;
      }

      .resizer {
        display: inline-block;
        background: blue;
        width: 2px;
        height: 100%;
        position: absolute;
        right: 0;
        top: 0;
        transform: translateX(50%);
        z-index: 1;
        ${'' /* prevents from scrolling while dragging on touch devices */}
        touch-action:none;

        &.isResizing {
          background: red;
        }
    }
  }

  .pagination {
    padding: 0.5rem;
  }

  .bold {
    font-weight: bold;
  }
`

/* Inner table, revealed on expansion */
  function Table2({data}) {

    const defaultColumn = React.useMemo(
      () => ({
        Filter: DefaultColumnFilter,
        minWidth: 30,
        width: 200,
        maxWidth: 400,
      }),
      []
    );

    const columns = 
      useMemo(() => [
        {
          Header: "",
          id: 'spacer',
          width: 30
        },
        {
          Header: 'Address',
          accessor: rec => {
            let addr = <div>{rec ? rec.address.address : ""}</div>
            if (rec.address2) {
              addr+= <div>{rec.address.address2}</div>
            }
            return addr;
          }
        },
        {
          Header: 'Locale',
          accessor: rec => `${rec.address.city}, ${rec.address.state}, ${rec.address.postal_code} ${rec.address.country}`
        },
        {
          Header: 'Phone',
          accessor: rec => rec.address.home_phone
        },
        {
          Header: 'Email',
          accessor: rec => rec.address.email
        }
      ],
      []
    )

    const {
      getTableProps,
      getTableBodyProps,
      headerGroups,
      toggleHideColumn,
      rows,
      prepareRow
    } = useTable(
      {
        columns,
        data,
        defaultColumn
      },
      useResizeColumns,
      useBlockLayout
    )

    if (!rows[0].original.temp_address) {
      useEffect(() => {
        toggleHideColumn('temp_address', true);
      }, [rows[0].original.temp_address]);
    }

    if (!rows[0].original.mobile_phone) {
      useEffect(() => {
        toggleHideColumn('mobile_phone', true);
      }, [rows[0].original.mobile_phone]);
    }

    if (!rows[0].original.work_phone) {
      useEffect(() => {
        toggleHideColumn('work_phone', true);
      }, [rows[0].original.work_phone]);
    }

    if (!rows[0].original.email) {
      useEffect(() => {
        toggleHideColumn('email', true);
      }, [rows[0].original.email]);
    }

    if (!rows[0].original.work_email) {
      useEffect(() => {
        toggleHideColumn('work_email', true);
      }, [rows[0].original.work_email]);
    }

    return (
    <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th
                  {...column.getHeaderProps()}>{column.render('Header')}
                  <div
                    {...column.getResizerProps()}
                    className={`resizer ${column.isResizing ? 'isResizing' : ''}`}
                  />
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row)
            return (
              <React.Fragment key={i}>
                <tr {...row.getRowProps()}>
                  {row.cells.map(cell => {
                    return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  })}
                </tr>
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    )
  }

/* Outer table */
function Table({ columns, data, showPagination, renderRowSubComponent}) {

  const defaultColumn = React.useMemo(
    () => ({
      Filter: DefaultColumnFilter,
    }),
    []
  )

  const filterTypes = React.useMemo(
    () => ({
      fuzzyText: fuzzyTextFilterFn,

      global: (rows, id, filterValue) => {
        //Ignore white space and parens for matching phone numbers
        const PHONE_REGEX = /[\s()]/g
        return rows.filter(row => {
          let select = false;
          //filter on cells displayed in outer table
          select|= Object.keys(row.values).reduce((acc, k)=> {
            return acc | (row.values[k] && String(row.values[k]).toLowerCase().includes(filterValue.toLowerCase()));
          }, false);

          //filter on household info displayed in expansion row
          if (row.original.address) {
            select|= Object.keys(row.original.address).reduce((acc, k) => 
              acc | row.original.address[k].replace(PHONE_REGEX, "").toLowerCase().includes(filterValue.replace(PHONE_REGEX, "").toLowerCase()), false);
          }

          //filter on household others
          row.original.others.forEach( member => {
            if (member.full_name.toLowerCase().includes(filterValue.toLowerCase())) {
              select = true;
            }
          })
          
          return select;
        })
      },

      household_others: (rows, id, filterValue) => {
        return rows.filter(row => {
          let select = false;
          row.original.others.forEach( member => {
            if (member.full_name.toLowerCase().includes(filterValue.toLowerCase())) {
              select = true;
            }
          })
          
          return select;
        })
      }
    }),
    []
  )
    
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    rows,
    state,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    visibleColumns,
    preGlobalFilteredRows,
    setGlobalFilter,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      globalFilter: 'global',
      filterTypes,
      initialState: { pageIndex: 0 },
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    useResizeColumns,
    useBlockLayout,
    useExpanded,
    usePagination
  )

  let orig_data = data.slice();

  data = showPagination ? page : rows
  return (
    <React.Fragment>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th
                  {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  <span>
                     {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                    </span>
                  <div>{column.canFilter ? column.render('Filter') : null}</div>
                  <div
                    {...column.getResizerProps()}
                    className={`resizer ${column.isResizing ? 'isResizing' : ''}`}
                  />
                </th>
              ))}
            </tr>
          ))}
        <tr>
          <th
            colSpan={visibleColumns.length}
            style={{
              textAlign: 'left',
            }}
          >
            <GlobalFilter
              preGlobalFilteredRows={preGlobalFilteredRows}
              globalFilter={state.globalFilter}
              setGlobalFilter={setGlobalFilter}
            />
          </th>
        </tr>
        </thead>
        <tbody {...getTableBodyProps()}>
          {data.map((row, i) => {
            prepareRow(row)
            return (
              <React.Fragment key={i}>
                <tr {...row.getRowProps()}>
                  {row.cells.map(cell => {
                    return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  })}
                </tr>
                {row.isExpanded ? (
                  <tr>
                    <td colSpan={visibleColumns.length}>
                      {renderRowSubComponent({ row , orig_data})}
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
      {showPagination ?
      <div className="mt-3 mx-auto">
          <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
            {'<<'}
          </button>{' '}
          <button onClick={() => previousPage()} disabled={!canPreviousPage}>
            {'<'}
          </button>{' '}
          <button onClick={() => nextPage()} disabled={!canNextPage}>
            {'>'}
          </button>{' '}
          <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
            {'>>'}
          </button>{' '}
          <span>
            Page{' '}
            <strong>
              {pageIndex + 1} of {pageOptions.length}
            </strong>{' '}
          </span>
          <span>
            | Go to page:{' '}
            <input
              type="number"
              defaultValue={pageIndex + 1}
              onChange={e => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0
                gotoPage(page)
              }}
              style={{ width: '100px' }}
            />
          </span>{' '}
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value))
            }}
          >
            {[10, 20, 30, 40, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
            <option key={rows.length} value={rows.length}>
              Show All
            </option>
          </select>
          <div>
            Displaying <strong>{rows.length}</strong> Records
          </div>
      </div> : <div> Displaying <strong>{rows.length}</strong> Records</div>}
    </React.Fragment>
  )
}

function getOthers(household) {
  let others = household.others.map( (member, idx) => <div key={idx}>{member.full_name}</div>);
  return <div>{others}</div>;
}

function HouseholdsTable(props) {

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const columns = useMemo(
    () => [
      {
        // Make an expander cell
        Header: () => <div className="card card-body h-100 justify-content-center"><Button onClick={handleShow}>Help</Button></div>,
        id: 'expander', // It needs an ID
        Cell: ({ row }) => (
          <span {...row.getToggleRowExpandedProps()}>
            {row.isExpanded ? <FontAwesomeIcon icon={faAngleDoubleDown} /> : <FontAwesomeIcon icon={faAngleDoubleRight} />}
          </span>
        )
      },
      {
          Header: 'Head',
          accessor:(rec) => rec.head.full_name,
          width: 350
      },
      {
          Header: 'Spouse',
          accessor: (rec) => rec.spouse ? rec.spouse.full_name : "",
          width: 350
      },
      {
        Header: 'Others',
        accessor: (rec) => getOthers(rec),
        filter: 'household_others',
        width: 350
      },
      {
        Header: '',
        accessor: 'edit',
        disableFilters: true,
        Cell: () => <center><Button className="btn btn-primary" onClick={() => alert('Not Implemented')}>Edit</Button></center>
      },
    ],
    []
  )

  const renderRowSubComponent = React.useCallback(
    ({row, orig_data}) => {
      return (
        <Styles>
          <Table2
            data={orig_data.slice(row.index, row.index+1)}
          />
        </Styles>
      )
    },
    []
  )

  const helpContents = [
    <li>Click <FontAwesomeIcon icon={faAngleDoubleRight} /> in a row to expand the record and show household details.</li>,
    <li>Enter search criteria in column headers to filter on specific member fields for the head or spouse.</li>,
    <li>Enter text in the global search field to filter on all member fields and household details.</li>
  ];


  return (
    <Styles>
       <HelpModal
        _show={show}
        closeButton={<Button variant="secondary" onClick={handleClose}>Close</Button>}
        hide={handleClose}
        title='Households View Help'
        contents={helpContents}
      />
      <Table
        columns={columns}
        data={props.data}
        showPagination={props.usePagination}
        renderRowSubComponent={renderRowSubComponent}
      />
    </Styles>
  )
}
export default HouseholdsTable;
