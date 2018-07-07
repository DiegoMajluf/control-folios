import { Db } from "mongodb";
export class ControlFolios {
    arbol: { [col: string]: { [field: string]: SubArbolType } } = {}
    constructor(protected db: Db) { }

    getNextFolio(collectionName: string, fieldFolio: string, ...fieldNamesFilters: { fieldName: string, fieldValue: string }[]) {
        if (!(collectionName in this.arbol)) this.arbol[collectionName] = {}
        if (!(fieldFolio in this.arbol)) this.arbol[collectionName][fieldFolio] = {}

        let ob = <ControlFolioObject>fieldNamesFilters.reduce((acc, sa, i) => {
            if (!(sa.fieldName in acc)) acc[sa.fieldName] = {}
            if (!(sa.fieldValue in acc[sa.fieldName])) acc[sa.fieldName][sa.fieldValue] = {}
            return acc[sa.fieldName][sa.fieldValue]
        }, <any>this.arbol[collectionName][fieldFolio])

        //El objecto es nuevo, es la primera vez que se pide el folio se consulta la base por única vez
        if (ob.lastFolio == null) {
            let filter = fieldNamesFilters.reduce((acc, va) => {
                acc[va.fieldName] = va.fieldValue
                return acc
            }, <any>{})
            ob.loadValuePromise = this.db.collection(collectionName)
                .find(filter, { [fieldFolio]: 1 })
                .sort(fieldFolio, -1)
                .limit(1)
                .toArray()
                .then(x => x[0])
                .then(x => {
                    if (x) return ob.lastFolio = (x[fieldFolio] || 0)
                    return 0
                })
        }
        /**
         * La promesa ya está creada y tiene como valor el último folio entregado o 0 si es la primera vez
         * Si aun no está resuelta se retorna el valor del folio siguiente una vez que se resuelva
         * Si está resuelta se retorna el valor del folio siguiente
        **/
        return ob.loadValuePromise = ob.loadValuePromise.then(folio => ++ob.lastFolio)
    }
}

interface SubArbolType {
    [field: string]: ControlFolioObject | SubArbolType
}

interface ControlFolioObject {
    lastFolio: number
    loadValuePromise: Promise<number>
}


