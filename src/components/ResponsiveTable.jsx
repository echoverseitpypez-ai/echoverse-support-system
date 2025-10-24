import React, { useState } from 'react'

/**
 * Responsive Table Component
 * Automatically switches to card layout on mobile
 */
const ResponsiveTable = ({ 
  columns = [], 
  data = [], 
  onRowClick,
  className = '',
  mobileCardComponent,
  ...props 
}) => {
  const [sortField, setSortField] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0
    
    const aVal = a[sortField]
    const bVal = b[sortField]
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Mobile Card Component
  const MobileCard = ({ item, index }) => {
    if (mobileCardComponent) {
      return mobileCardComponent({ item, index })
    }

    return (
      <div 
        className="card mobile-table-card"
        onClick={() => onRowClick?.(item)}
        style={{ cursor: onRowClick ? 'pointer' : 'default' }}
      >
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="mobile-table-row">
            <div className="mobile-table-label">{column.header}</div>
            <div className="mobile-table-value">
              {column.render ? column.render(item[column.key], item) : item[column.key]}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="table-container hidden md:block">
        <table className={`table ${className}`} {...props}>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th 
                  key={index}
                  onClick={() => column.sortable && handleSort(column.key)}
                  style={{ 
                    cursor: column.sortable ? 'pointer' : 'default',
                    userSelect: 'none'
                  }}
                  className={column.sortable ? 'sortable' : ''}
                >
                  <div className="th-content">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="sort-indicator">
                        {sortField === column.key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => (
              <tr 
                key={index}
                onClick={() => onRowClick?.(item)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                className="table-row"
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex}>
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-table-container md:hidden">
        {sortedData.map((item, index) => (
          <MobileCard key={index} item={item} index={index} />
        ))}
      </div>
    </>
  )
}

export default ResponsiveTable
