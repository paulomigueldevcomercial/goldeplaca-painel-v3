import React, { useMemo, useState } from 'react'
import { CPagination, CPaginationItem } from '@coreui/react'

const DEFAULT_PAGE_SIZE = 10
const MAX_VISIBLE_PAGES = 5

const clampPage = (page, totalPages) => Math.min(Math.max(page, 1), totalPages)

const buildPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const halfWindow = Math.floor(MAX_VISIBLE_PAGES / 2)
  const startPage = clampPage(currentPage - halfWindow, totalPages - MAX_VISIBLE_PAGES + 1)
  const endPage = Math.min(startPage + MAX_VISIBLE_PAGES - 1, totalPages)

  return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index)
}

const ListPagination = ({
  items,
  pageSize = DEFAULT_PAGE_SIZE,
  summaryLabel = 'registros',
  className = 'border-top',
  children,
}) => {
  const listItems = useMemo(() => (Array.isArray(items) ? items : []), [items])
  const [paginationState, setPaginationState] = useState({
    items,
    page: 1,
    pageSize,
  })
  const totalItems = listItems.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const requestedPage =
    paginationState.items === items && paginationState.pageSize === pageSize
      ? paginationState.page
      : 1
  const currentPage = clampPage(requestedPage, totalPages)

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return listItems.slice(startIndex, startIndex + pageSize)
  }, [currentPage, listItems, pageSize])

  const pageNumbers = useMemo(
    () => buildPageNumbers(currentPage, totalPages),
    [currentPage, totalPages],
  )

  const handlePageChange = (page) => (event) => {
    event.preventDefault()
    setPaginationState({
      items,
      page: clampPage(page, totalPages),
      pageSize,
    })
  }

  if (totalItems <= pageSize) {
    return children(listItems)
  }

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <>
      {children(paginatedItems)}
      <div
        className={`d-flex flex-wrap justify-content-between align-items-center gap-2 p-3 ${className}`}
      >
        <div className="small text-medium-emphasis">
          Mostrando {startItem}-{endItem} de {totalItems} {summaryLabel}
        </div>
        <CPagination size="sm" className="mb-0" aria-label="Paginação da listagem">
          <CPaginationItem
            href="#"
            disabled={currentPage === 1}
            onClick={handlePageChange(currentPage - 1)}
          >
            Anterior
          </CPaginationItem>
          {pageNumbers.map((page) => (
            <CPaginationItem
              key={page}
              href="#"
              active={page === currentPage}
              onClick={handlePageChange(page)}
            >
              {page}
            </CPaginationItem>
          ))}
          <CPaginationItem
            href="#"
            disabled={currentPage === totalPages}
            onClick={handlePageChange(currentPage + 1)}
          >
            Próxima
          </CPaginationItem>
        </CPagination>
      </div>
    </>
  )
}

export default ListPagination
