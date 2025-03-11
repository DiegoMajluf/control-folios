import { Db, ObjectId } from "mongodb";
type FieldNameFilter = {
    fieldName: string,
    fieldValue: string | number | boolean | ObjectId | Date
}
export class ControlFolios {
    private arbol: { [col: string]: { [field: string]: SubArbolType } } = {}
    constructor(protected db: Db | Promise<Db>) { }


    /**
     * Devuelve el folio siguiente para el control de folio especificado en los parámetros
     * @param collectionName Es el nombre de la colleción en la base de datos que contiene el folio
     * @param fieldFolio Es el nombre del campo dentro de la colleción que se debe incrementar
     * @param fieldNamesFilters Un arreglo de campos con valor para los cuales se lleva un control del folio. Ej: idCliente
     */
    async getNextFolio(collectionName: string, fieldFolio: string, ...fieldNamesFilters: FieldNameFilter[]) {
        let ob = this.getUltimaPromesa(collectionName, fieldFolio, ...fieldNamesFilters)
        return ob.promiseValue = ob.promiseValue.then(val => ++val)

    }

    /**
 * Devuelve el último folio asignado para el control de folio especificado en los parámetros
 * @param collectionName Es el nombre de la colleción en la base de datos que contiene el folio
 * @param fieldFolio Es el nombre del campo dentro de la colleción que se debe incrementar
 * @param fieldNamesFilters Un arreglo de campos con valor para los cuales se lleva un control del folio. Ej: idCliente
 */
    ultimoFolio(collectionName: string, fieldFolio: string, ...fieldNamesFilters: FieldNameFilter[]) {

        return this.getUltimaPromesa(collectionName, fieldFolio, ...fieldNamesFilters).promiseValue
    }

    private getUltimaPromesa(collectionName: string, fieldFolio: string, ...fieldNamesFilters: FieldNameFilter[]): { promiseValue: Promise<number> } {

        this.arbol[collectionName] ||= {}
        this.arbol[collectionName][fieldFolio] ||= {}



        let ob = this.getFolioMemoryObject(collectionName, fieldFolio, ...fieldNamesFilters)

        //El objecto es nuevo, es la primera vez que se pide el folio se consulta la base por única vez
        ob.promiseValue ||= this.getFolioFromDb(fieldNamesFilters.reduce((acc, va) => {
            acc[va.fieldName] = va.fieldValue
            return acc
        }, {}), collectionName, fieldFolio, ...fieldNamesFilters)

        /**
         * La promesa ya está creada y tiene como valor el último folio entregado o 0 si es la primera vez.
         * Si aun no está resuelta se retorna el valor del folio siguiente una vez que se resuelva
         * Si está resuelta se retorna el valor del folio siguiente inmediatamente
        **/

        return <{ promiseValue: Promise<number> }>ob
    }


    /**
     * Elimina de la memoria el registro de folios asociados al control especificado en los parámetros
     * @param collectionName Es el nombre de la colleción en la base de datos que contiene el folio
     * @param fieldFolio Es el nombre del campo dentro de la colleción que se debe incrementar
     * @param fieldNamesFilters Un arreglo de campos con valor para los cuales se lleva un control del folio. Ej: idCliente
     */
    resetFolio(collectionName: string, fieldFolio: string, ...fieldNamesFilters: FieldNameFilter[]) {

        let ob = this.getFolioMemoryObject(collectionName, fieldFolio, ...fieldNamesFilters)
        delete ob.promiseValue

    }

    private getFolioMemoryObject(collectionName: string, fieldFolio: string, ...fieldNamesFilters: FieldNameFilter[]) {

        return <{ promiseValue?: Promise<number> }>fieldNamesFilters.reduce((acc, sa, i) => {
            acc[sa.fieldName] ||= {}
            let fv = sa.fieldValue
            if (typeof fv == 'object' && 'getMonth' in fv) fv = fv.toJSON()
            else if (typeof fv == 'object') fv = fv.toHexString()
            fv = fv.toString()
            acc[sa.fieldName][fv] ||= {}
            return acc[sa.fieldName][fv]
        }, this.arbol[collectionName][fieldFolio])
    }

    private getFolioFromDb(filter: any, collectionName: string, fieldFolio: string, ...fieldNamesFilters: FieldNameFilter[]): Promise<number> {
        let fieldFol = fieldFolio.split('.')
        return new Promise(async (res, rej) => {
            let base = await this.db
            res(base.collection(collectionName)
                .find(filter, { [fieldFolio]: 1 })
                .sort(fieldFolio, -1)
                .limit(-1)
                .toArray()
                .then(x => x[0])
                .then(x => x && fieldFol.reduce((acc, field) => acc[field], x) || 0))
        })
    }
}

interface SubArbolType {
    [field: string]: { promiseValue: Promise<number> } | SubArbolType
}



