import React from 'react'
import {
  createCompeticaoHistorico,
  deleteCompeticaoHistorico,
  listCompeticoesHistorico,
  updateCompeticaoHistorico,
} from '../../services/competicoesHistoricoApi'
import CatalogoHistoricoCrud from './CatalogoHistoricoCrud'

const CompeticoesHistoricoCrud = () => (
  <CatalogoHistoricoCrud
    title="Competições do histórico"
    description="Cadastro das competições usadas nos filtros e registros do histórico."
    listTitle="Competições"
    formTitle="competição"
    fieldName="nome"
    fieldLabel="Nome da competição"
    searchPlaceholder="Pesquisar competição"
    emptyMessage="Nenhuma competição histórica cadastrada."
    summaryLabel="competições históricas"
    listItems={listCompeticoesHistorico}
    createItem={createCompeticaoHistorico}
    updateItem={updateCompeticaoHistorico}
    deleteItem={deleteCompeticaoHistorico}
  />
)

export default CompeticoesHistoricoCrud
