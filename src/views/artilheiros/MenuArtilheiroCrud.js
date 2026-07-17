import React from 'react'
import {
  createMenuArtilheiro,
  deleteMenuArtilheiro,
  listMenuArtilheiro,
  updateMenuArtilheiro,
} from '../../services/menuArtilheiroApi'
import CatalogoHistoricoCrud from '../historicos/CatalogoHistoricoCrud'

const MenuArtilheiroCrud = () => (
  <CatalogoHistoricoCrud
    title="Menu de artilheiros"
    description="Cadastro das competições disponíveis para os maiores artilheiros."
    listTitle="Competições"
    formTitle="competição"
    fieldName="nomeCompeticao"
    fieldLabel="Nome da competição"
    searchPlaceholder="Pesquisar competição"
    emptyMessage="Nenhuma competição cadastrada no menu de artilheiros."
    summaryLabel="competições do menu"
    listItems={listMenuArtilheiro}
    createItem={createMenuArtilheiro}
    updateItem={updateMenuArtilheiro}
    deleteItem={deleteMenuArtilheiro}
  />
)

export default MenuArtilheiroCrud
