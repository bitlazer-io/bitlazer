import clsx from 'clsx'
import React, { FC } from 'react'

import s from './MyTable.module.scss'

export interface IColumn {
  key: string
  label: string
  hide?: boolean
}

interface IMyTable {
  className?: string
  classNameTable?: string
  columns: IColumn[]
  data: { [key: string]: React.ReactNode }[]
}

const MyTable: FC<IMyTable> = ({ columns, data, className, classNameTable }) => {
  return (
    <div className={clsx('relative overflow-x-auto', className, s.table)}>
      <table
        className={clsx(
          'w-full text-left text-zinc-300 custom-table text-sm font-light',
          classNameTable,
        )}
      >
        <thead className="">
          <tr>
            {columns.map((column, index) => (
              <th key={index} scope="col">
                {!column.hide && (
                  <div className="inline-flex flex-col" title={column.label}>
                    {column.label}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm font-light">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, colIndex) => (
                <td key={colIndex}>
                  <div className="inline-flex flex-col">{row[column.key]}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default MyTable
