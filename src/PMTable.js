import React, { useMemo, useEffect } from 'react'
import styled from 'styled-components'
import { useTable, usePagination, useFilters, useGlobalFilter, useExpanded } from 'react-table'
import { DefaultColumnFilter, fuzzyTextFilterFn, GlobalFilter,
  NumberRangeColumnFilter, SelectColumnFilter} from "./Filters.js"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleDoubleRight } from '@fortawesome/free-solid-svg-icons'
import { faAngleDoubleDown } from '@fortawesome/free-solid-svg-icons'


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
    }
  }

  .pagination {
    padding: 0.5rem;
  }
`

  // Define a default UI for filtering

  function Table2({data, getHousehold}) {

    const defaultColumn = React.useMemo(
      () => ({
        // Let's set up our default Filter UI
        Filter: DefaultColumnFilter,
      }),
      []
    );

    const formatAddress = addr => {
      let s = '';
      if (addr.address) {
        s+= addr.address;
      }
      if (addr.address2) {
        s+= `\n${addr.address2}`
      }
      if (addr.city) {
        s+= `\n${addr.city}`
      }
      if (addr.state) {
        s+= `, ${addr.state}`
      }
      if (addr.postal_code) {
        s+= ` ${addr.postal_code}`
      }
      if (addr.country && addr.country.toUpperCase() !== 'USA') {
        s+= `\n${addr.country}`
      }
      return s;
    };

    const getAddress = rec => {
      let household = getHousehold(rec.household);
      return household.address ? formatAddress(household.address) : null;
    };

    const getHomePhone = rec => {
      let household = getHousehold(rec.household);
      return household.address.home_phone ? household.address.home_phone : null;
    };

    const getHomeEmail = rec => {
      let household = getHousehold(rec.household);
      return household.address.email ? household.address.email : null;
    };

    const columns = 
      useMemo(() => [
        {
          Header: "Member Info",
          columns: [
            {
              Header: 'Temp Address',
              accessor: 'temp_address'
            },
            {
              Header: 'Phone (mobile)',
              accessor: 'mobile_phone'
            },
            {
              Header: 'Phone (work)',
              accessor: 'work_phone'
            },
            {
              Header: 'Email',
              accessor: 'email'
            },
            {
              Header: 'Email (work)',
              accessor: 'work_email'
            },
          ],
        },
        {
          Header: "Household Info",
          columns: [
            {
              Header: 'Address',
              id: "address",
              accessor: rec => getAddress(rec)
            },
            {
              Header: 'Home Phone',
              id: "home_phone",
              accessor: rec => getHomePhone(rec)
            },
            {
              Header: 'Email',
              id: "home_email",
              accessor: rec => getHomeEmail(rec)
            }
          ]
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
      }
    )

    if (!rows[0].original.temp_address) {
      useEffect(() => {
        toggleHideColumn('temp_address', true);
      }, [rows[0].temp_address]);
    }

    if (!rows[0].original.mobile_phone) {
      useEffect(() => {
        toggleHideColumn('mobile_phone', true);
      }, [rows[0].mobile_phone]);
    }

    if (!rows[0].original.work_phone) {
      useEffect(() => {
        toggleHideColumn('work_phone', true);
      }, [rows[0].work_phone]);
    }

    if (!rows[0].original.email) {
      useEffect(() => {
        toggleHideColumn('email', true);
      }, [rows[0].email]);
    }

    if (!rows[0].original.work_email) {
      useEffect(() => {
        toggleHideColumn('work_email', true);
      }, [rows[0].work_email]);
    }

    return (
    <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th
                  {...column.getHeaderProps()}>{column.render('Header')}
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


function Table({ columns, data, showPagination, renderRowSubComponent, getHousehold}) {

  const defaultColumn = React.useMemo(
    () => ({
      // Let's set up our default Filter UI
      Filter: DefaultColumnFilter,
    }),
    []
  )

  const filterTypes = React.useMemo(
    () => ({
      // Add a new fuzzyTextFilterFn filter type.
      fuzzyText: fuzzyTextFilterFn,
      // Or, override the default text filter to use
      // "startWith"
      text: (rows, id, filterValue) => {
        return rows.filter(row => {
          const rowValue = row.values[id]
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase())
            : true
        })
      },
      matchPhoneNumber: (rows, id, filterValue) => {
        return rows.filter(row => {
          const rowValue = row.values[id]
          return rowValue !== undefined
            ? String(rowValue).replace(/[()mw\s]/g, '')
                .toLowerCase()
                .includes(String(filterValue).replace(/[()mw\s]/g, '').toLowerCase())
            : false
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
      filterTypes,
      initialState: { pageIndex: 0 },
    },
    useFilters,
    useGlobalFilter,
    useExpanded, usePagination
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
                  {...column.getHeaderProps()}>{column.render('Header')}
                  <div>{column.canFilter ? column.render('Filter') : null}</div>
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
                      {/*
                          Inside it, call our renderRowSubComponent function. In reality,
                          you could pass whatever you want as props to
                          a component like this, including the entire
                          table instance. But for this example, we'll just
                          pass the row
                        */}
                      {renderRowSubComponent({ row , orig_data, getHousehold})}
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
          </select>
      </div> : null}
    </React.Fragment>
  )
}

function PMTable(props) {
  const columns = useMemo(
    () => [
      {
        // Make an expander cell
        Header: () => "Show Details", // No header
        id: 'expander', // It needs an ID
        Cell: ({ row }) => (
          // Use Cell to render an expander for each row.
          // We can use the getToggleRowExpandedProps prop-getter
          // to build the expander.
          <span {...row.getToggleRowExpandedProps()}>
            {row.isExpanded ? <FontAwesomeIcon icon={faAngleDoubleDown} /> : <FontAwesomeIcon icon={faAngleDoubleRight} />}
          </span>
        )
      },
      {
          Header: 'Name',
          accessor: 'full_name'
      },
      {
          Header: 'Member Status',
          accessor: 'status',
          Filter: SelectColumnFilter,
          filter: 'includes',
      },
      {
        Header: 'Marital Status',
        accessor: 'marital_status',
        Filter: SelectColumnFilter,
        filter: 'includes',
    },
      {
        Header: 'Age',
        accessor: rec => calculateAge(rec.date_of_birth),
        Filter: NumberRangeColumnFilter,
        filter: 'between',
      },
      {
          Header: 'Resident',
          accessor: rec => rec.resident ? 'Yes': 'No',
          Filter: SelectColumnFilter,
          filter: 'includes',
      },
    ],
    []
  )

  const renderRowSubComponent = React.useCallback(
    ({row, orig_data, getHousehold}) => {
      return (
        <Styles>
          <Table2
            data={orig_data.slice(row.index, row.index+1)}
            getHousehold={getHousehold}
          />
        </Styles>
      )
    },
    []
  )

  function calculateAge(dob){
    let diff =(new Date().getTime() - new Date(dob).getTime()) / 1000;
     diff /= (60 * 60 * 24);
    return Math.abs(Math.floor(diff/365.25));
  }

  // function getPhoneNumber(rec) {
  //   let s = ''
  //   let delim = ''
  //   if (rec.work_phone){
  //     s+= `(w) ${rec.work_phone}`
  //     delim = '\n'
  //   }
  //   if (rec.mobile_phone){
  //     s+=  `${delim}(m) ${rec.mobile_phone}`
  //   }
  //   return s;
  // }

  return (
    <Styles>
      <Table
        columns={columns}
        data={props.data}
        showPagination={props.usePagination}
        renderRowSubComponent={renderRowSubComponent}
        getHousehold={props.getHouseholdCB}
      />
    </Styles>
  )
}
export default PMTable;
