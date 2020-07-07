import React, { useMemo } from 'react'
import styled from 'styled-components'
import { useTable, usePagination, useFilters, useGlobalFilter, useExpanded, useBlockLayout,
  useResizeColumns, useSortBy } from 'react-table'
import { useEffect } from 'react'
const moment = require('moment');


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

function Table({ columns, data, showPagination, filter, setResultsReady, setFilteredRows}) {

  const defaultColumn = React.useMemo(
    () => ({
      minWidth: 30,
      width: 200,
      maxWidth: 400,
    }),
    []
  )

  const filterTypes = React.useMemo(
    () => ({
      global: (rows, id, filterValue) => {
        let filteredRows = rows.filter(row => {
          let res =  moment(row.values.date_of_birth).format("MMMM").toLowerCase() === filterValue.month;
          return res;
        });
        setFilteredRows(filteredRows);
        return filteredRows;
      }
    }),
    [setFilteredRows]
  )
    
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    rows,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    visibleColumns,
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
    useExpanded,
    usePagination,
    useBlockLayout,
    useResizeColumns
  )

  data = showPagination ? page : rows

  useEffect(() => {
    setGlobalFilter(filter)
  }, [filter, setGlobalFilter]);
  setResultsReady(rows.length > 0);
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

function QueryResultsTable(props) {

  const columns = useMemo(
    () => [
      {
          Header: 'Name',
          accessor: 'full_name',
          width: 400
      },
      {
        Header: 'Date of Birth',
        accessor: 'date_of_birth',
      }
    ],
    []
  )

  return (
    <Styles>
      <Table
        columns={columns}
        data={props.data}
        filter={props.filter}
        showPagination={props.usePagination}
        setResultsReady={props.setResultsReady}
        setFilteredRows={props.setFilteredRows}
      />
    </Styles>
  )
}
export default QueryResultsTable;
