import React from 'react'
import matchSorter from 'match-sorter'

export function GlobalFilter({
    preGlobalFilteredRows,
    globalFilter,
    setGlobalFilter,
  }) {
    const count = preGlobalFilteredRows.length
  
    return (
      <span>
        Search All Fields:{' '}
        <input
          value={globalFilter || ''}
          onChange={e => {
            setGlobalFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
          }}
          placeholder={`${count} records...`}
          style={{
            fontSize: '1.1rem',
            border: '0',
          }}
        />
      </span>
    )
  }
  
  // Default UI for filtering
  export function DefaultColumnFilter({
    column: { filterValue, setFilter }, column
  }) {
    return (
      <input
        value={filterValue || ''}
        onChange={e => {
          setFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
        }}
        placeholder={`Search ${typeof column.Header === 'function' ? column.id : column.Header}...`}
      />
    )
  }
  
 export  function PhoneNumberColumnFilter({
    column: { filterValue, preFilteredRows, setFilter },
  }) {
    const count = preFilteredRows.length
  
    return (
      <input
        value={filterValue || ''}
        onChange={e => {
          setFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
        }}
        placeholder={`Search ${count} records...`}
      />
    )
  }
  
  // Custom filter UI for selecting
  // a unique option from a list
export  function SelectColumnFilter({
    column: { filterValue, setFilter, preFilteredRows, id },
  }) {
    // Calculate the options for filtering
    // using the preFilteredRows
    const options = React.useMemo(() => {
      const options = new Set()
      preFilteredRows.forEach(row => {
        options.add(row.values[id])
      })
      return [...options.values()]
    }, [id, preFilteredRows])
  
    // Render a multi-select box
    return (
      <select
        value={filterValue}
        onChange={e => {
          setFilter(e.target.value || undefined)
        }}
      >
        <option value="">All</option>
        {options.map((option, i) => (
          <option key={i} value={option}>
            {option}
          </option>
        ))}
      </select>
    )
  }
  
  // Custom filter UI that uses a
  // slider to set the filter value between a column's
  // min and max values
  // export function SliderColumnFilter({
  //   column: { filterValue, setFilter, preFilteredRows, id },
  // }) {
  //   // Calculate the min and max
  //   // using the preFilteredRows
  
  //   const [min, max] = React.useMemo(() => {
  //     let min = preFilteredRows.length ? preFilteredRows[0].values[id] : 1000
  //     let max = 0
  //     preFilteredRows.forEach(row => {
  //       min = Math.min(row.values[id], min)
  //       max = Math.max(row.values[id], max)
  //     })
  //     return [min, max]
  //   }, [id, preFilteredRows])
  
  //   return (
  //     <div>
  //       <input
  //         type="range"
  //         min={min}
  //         max={max}
  //         value={filterValue || min}
  //         onChange={e => {
  //           setFilter(parseInt(e.target.value, 10))
  //         }}
  //       />
  //       <button onClick={() => setFilter(undefined)}>Off</button>
  //     </div>
  //   )
  // }
  
  // Custom UI for our 'between' or number range
  // filter. It uses two number boxes and filters rows to
  // ones that have values between the two
export function NumberRangeColumnFilter({
    column: { filterValue = [], preFilteredRows, setFilter, id },
  }) {
    const [min, max] = React.useMemo(() => {
      let min = preFilteredRows.length ? Number.MAX_SAFE_INTEGER : 0
      let max = 0
      preFilteredRows.forEach(row => {
        if (row.values[id]) {
          min = Math.min(row.values[id], min);
          max = Math.max(row.values[id], max)
        }
      })
      return [min, max]
    }, [id, preFilteredRows])
  
    return (
      <div
        style={{
          display: 'flex',
        }}
      >
        <input
          value={filterValue[0] || ''}
          type="number"
          onChange={e => {
            const val = e.target.value
            setFilter((old = []) => [val ? parseInt(val, 10) : undefined, old[1]])
          }}
          placeholder={`${min}`}
          style={{
            width: '70px',
            marginRight: '0.5rem',
          }}
        />
        to
        <input
          value={filterValue[1] || ''}
          type="number"
          onChange={e => {
            const val = e.target.value
            setFilter((old = []) => [old[0], val ? parseInt(val, 10) : undefined])
          }}
          placeholder={`${max}`}
          style={{
            width: '70px',
            marginLeft: '0.5rem',
          }}
        />
      </div>
    )
  }

  export function formatDate(date) {
    let dateString ='';
    if (date){
      let dateVal =  new Date(date);
      dateString = `${dateVal.getUTCFullYear()}-${String(dateVal.getUTCMonth() + 1).padStart(2, '0')}-${String(dateVal.getUTCDate()).padStart(2, '0')}`
    }
    return dateString;
  }

  export function DateRangeColumnFilter({
    column: { preFilteredRows, setFilter, id },
  }) {
    const [min, max] = React.useMemo(() => {
      let min = new Date().getTime()
      let max = 0
      preFilteredRows.forEach(row => {
        if (row.values[id] !== "") {
          min = Math.min(new Date(row.values[id]).getTime(), min);
          max = Math.max(new Date(row.values[id]).getTime(), max)
        }
      })
      return [min, max]
    }, [id, preFilteredRows])

    if (formatDate(min) === '20-02-13') {
      console.log(`Bad date ${formatDate(min)}, ${min}`)
    }
  
    return (
      <div
        style={{
          display: 'flex',
        }}
      >
        <input
          type="text"
          onChange={e => {
            const val = e.target.value
            setFilter((old = []) => [val ? new Date(val).getTime(): undefined, old[1]])
          }}
          placeholder={formatDate(min)}
          style={{
            width: '140px',
            marginRight: '0.5rem',
          }}
        />
        to
        <input
          type="text"
          onChange={e => {
            const val = e.target.value
            setFilter((old = []) => [old[0], val ? new Date(val).getTime(): undefined])
          }}
          placeholder={formatDate(max)}
          style={{
            width: '140px',
            marginLeft: '0.5rem',
          }}
        />
      </div>
    )
  }
  
  export function fuzzyTextFilterFn(rows, id, filterValue) {
    return matchSorter(rows, filterValue, { keys: [row => row.values[id]] })
  }
  
  // Let the table remove the filter if the string is empty
  fuzzyTextFilterFn.autoRemove = val => !val


// Define a custom filter filter function!
function filterGreaterThan(rows, id, filterValue) {
    return rows.filter(row => {
      const rowValue = row.values[id]
      return rowValue >= filterValue
    })
  }
  
  // This is an autoRemove method on the filter function that
  // when given the new filter value and returns true, the filter
  // will be automatically removed. Normally this is just an undefined
  // check, but here, we want to remove the filter if it's not a number
  filterGreaterThan.autoRemove = val => typeof val !== 'number'

