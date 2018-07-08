import { Db, ObjectId } from "mongodb";
export class ControlFolios {
    arbol: { [col: string]: { [field: string]: SubArbolType } } = {}
    constructor(protected db: Db) { }

    /**
     * Devuelve el folio siguiente para el control de folio especificado en los parámetros
     * @param collectionName Es el nombre de la colleción en la base de datos que contiene el folio
     * @param fieldFolio Es el nombre del campo dentro de la colleción que se debe incrementar
     * @param fieldNamesFilters Un arreglo de campos con valor para los cuales se lleva un control del folio. Ej: idCliente
     */
    getNextFolio(collectionName: string, fieldFolio: string, ...fieldNamesFilters:
        {
            fieldName: string,
            fieldValue: string | number | boolean | ObjectId | Date
        }[]) {
        if (!(collectionName in this.arbol)) {this.arbol[collectionName] = {}}
        if (!(fieldFolio in this.arbol[collectionName])) this.arbol[collectionName][fieldFolio] = {}



        let ob = <{ promiseValue: Promise<number> }>fieldNamesFilters.reduce((acc, sa, i) => {
            if (!(sa.fieldName in acc)) acc[sa.fieldName] = {}
            let fv = sa.fieldValue
            if(typeof fv == 'object' && 'getMonth' in fv) fv = fv.toJSON()
            else if(typeof fv == 'object') fv = fv.toHexString()
            fv = fv.toString()
            if (!(fv in acc[sa.fieldName])) acc[sa.fieldName][fv] = {}
            return acc[sa.fieldName][fv]
        }, <any>this.arbol[collectionName][fieldFolio])


        //El objecto es nuevo, es la primera vez que se pide el folio se consulta la base por única vez
        if (ob.promiseValue == null) {
            let filter = fieldNamesFilters.reduce((acc, va) => {
                acc[va.fieldName] = va.fieldValue
                return acc
            }, <any>{})
            ob.promiseValue = this.db.collection(collectionName)
                .find(filter, { [fieldFolio]: 1 })
                .sort(fieldFolio, -1)
                .limit(1)
                .toArray()
                .then(x => x[0])
                .then(x => {
                    if (x != null) return (x[fieldFolio] || 0)
                    return 0
                })
        }
        /**
         * La promesa ya está creada y tiene como valor el último folio entregado o 0 si es la primera vez
         * Si aun no está resuelta se retorna el valor del folio siguiente una vez que se resuelva
         * Si está resuelta se retorna el valor del folio siguiente inmediatamente
        **/
        return ob.promiseValue = ob.promiseValue.then(folio => ++folio)
    }
}

interface SubArbolType {
    [field: string]: { promiseValue: Promise<number> } | SubArbolType
}



