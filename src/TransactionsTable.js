import React, { useMemo } from 'react'
import { Button } from 'react-bootstrap'
import styled from 'styled-components'
import { useTable, usePagination, useFilters, useGlobalFilter, useExpanded,
  useGroupBy, useSortBy } from 'react-table'
import { DefaultColumnFilter, fuzzyTextFilterFn, GlobalFilter,
  DateRangeColumnFilter, formatDate} from "./Filters.js"
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

  .w-150 {
    width: 150px;
  }
`

const TRANSACTION_TYPES = {
  BIRTH: "Birth",
  PROFESSION: "Profession",
  RECEIVED: "Received",
  SUSPENDED: "Suspended",
  SUSPENSION_LIFTED: "Suspension Lifted",
  EXCOMMUNICATED: "Excommunicated",
  RESTORED: "Restored",
  DISMISSAL_PENDING: "Dismissal Pending",
  DISMISSED: "Dismissed",
  REMOVED_ADMIN: "Administratively Removed",
  DIED: "Deceased"

}

function useControlledState(state, { instance }) {
  return React.useMemo(() => {
    if (state.groupBy.length) {
      return {
        ...state,
        hiddenColumns: [...state.hiddenColumns, ...state.groupBy].filter(
          (d, i, all) => all.indexOf(d) === i
        ),
      }
    }
    return state
  }, [state])
}

function Table({ columns, data, showPagination}) {

  const defaultColumn = React.useMemo(
    () => ({
      Filter: DefaultColumnFilter,
      width: 200,
    }),
    []
  )

  const filterTypes = React.useMemo(
    () => ({
      fuzzyText: fuzzyTextFilterFn,
      global: (rows, id, filterValue) => {
        return rows.filter(row => {
          let select = false;
          //filter on cells displayed in outer table
          select|= Object.keys(row.values).reduce((acc, k)=> {
            return acc || (row.values[k] && String(row.values[k]).toLowerCase().includes(filterValue.toLowerCase())) ||
            (row.values[k] && formatDate(new Date(row.values[k])).includes(filterValue.toLowerCase()));
          }, false);

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
      initialState: { pageIndex: 0, groupBy: ['type'] },
    },
    useFilters,
    useGlobalFilter,
    useGroupBy,
    useSortBy,
    useExpanded,
    usePagination,
    hooks => {
      hooks.useControlledState.push(useControlledState)
      hooks.visibleColumns.push((columns, { instance }) => {
        if (!instance.state.groupBy.length) {
          return columns
        }

        return [
          {
            id: 'expander', // Make sure it has an ID
            // Build our expander column
            Header: ({ allColumns, state: { groupBy } }) => {
              return groupBy.map(columnId => {
                const column = allColumns.find(d => d.id === columnId)

                return (
                  <span {...column.getHeaderProps()}>
                    {column.render('Header')}{' '}
                  </span>
                )
              })
            },
            disableResizing: true,
            minWidth: 400,
            width: 400,
            maxWidth: 400,
            Cell: ({ row }) => {
              if (row.canExpand) {
                const groupedCell = row.allCells.find(d => d.isGrouped)

                return (
                  <span
                    {...row.getToggleRowExpandedProps({
                      style: {
                        // We can even use the row.depth property
                        // and paddingLeft to indicate the depth
                        // of the row
                        paddingLeft: `${row.depth * 2}rem`,
                      },
                    })}
                  >
                    {row.isExpanded ? <FontAwesomeIcon icon={faAngleDoubleDown} /> : <FontAwesomeIcon icon={faAngleDoubleRight} />} {groupedCell.render('Cell')}{' '}
                    ({row.subRows.length})
                  </span>
                )
              }

              return null
            },
          },
          ...columns,
        ]
      })
    }
  )

  data = showPagination ? page : rows
  return (
    <React.Fragment>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  <span>
                    {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                  </span>
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
                    return (
                      <td
                        {...cell.getCellProps()}
                        style={{
                          background: cell.isGrouped
                            ? '#0aff0082'
                            : cell.isAggregated
                            ? '#ffa50078'
                            : cell.isPlaceholder
                            ? '#ff000042'
                            : 'white',
                        }}
                      >
                        {cell.isAggregated
                          ? // If the cell is aggregated, use the Aggregated
                            // renderer for cell
                            cell.render('Aggregated')
                          : cell.isPlaceholder
                          ? null // For cells with repeated values, render null
                          : // Otherwise, just render the regular cell
                            cell.render('Cell')}
                      </td>
                    )

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

function TransactionsTable(props) {
  const columns = useMemo(
    //Column width is not respected when using groupBy, so we set it for each Header
    () => [
      {
        Header: () => <div className="card card-body h-100 w-150 justify-content-center"><Button>Help</Button></div>,
        id: "type",
        accessor: row => TRANSACTION_TYPES[row.type],
        aggregate: "count",
        Aggregated: ({ value} ) => value,
        width: 300
      },
      {
        Header: () => <span style={{width: "300px"}}>Name</span>,
        accessor: "name",
        id: "Name"
      },
      {
        Header: () => <span style={{width: "50px"}}>Authority</span>,
        accessor: "authority",
        id: "Authority"
      },
      {
        Header: () => <span style={{width: "300px"}}>Church</span>,
        accessor: 'church',
        id: "Church"
      },
      {
        Header: () => <span style={{width: "250px"}}>Date</span>,
        id: "Date",
        accessor: row => new Date(row.date).getTime(),
        Filter: DateRangeColumnFilter,
        Cell: ( {row} ) => formatDate(row.values.Date),
        filter: 'between'
      },
      {
        Header: 'Comment',
        accessor: 'comment',
      },
    ],
    []
  )

  return (
    <Styles>
      <Table
        columns={columns}
        data={props.data}
        showPagination={props.usePagination}
      />
    </Styles>
  )
}
export default TransactionsTable;
