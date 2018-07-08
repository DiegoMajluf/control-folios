import { ControlFolios } from ".";
import { Db } from "./node_modules/@types/mongodb";

const db = {
    collection: (name: string) => ({
        find: (ob: any, ob2: any) => ({
            sort: (field: string, cant: number) => ({
                limit: (cant: number) => ({
                    toArray: () => {
                        console.log("esperando el primer folio")
                        return new Promise(r => setTimeout(() => r([{
                            folio: Math.round(Math.random() * 100)
                        }]), 2000))
                    }
                })
            })
        })
    })
}

let cf = new ControlFolios(<Db>db)

let p = cf.getNextFolio('hola', 'folio', { fieldName: 'id_cliente', fieldValue: "1" })
p.then(x => console.log(x))

cf.getNextFolio('hola', 'folio', { fieldName: 'id_cliente', fieldValue: "1" })
    .then(x => console.log(x))
cf.getNextFolio('hola', 'folio', { fieldName: 'id_cliente', fieldValue: "1" })
    .then(x => console.log(x))
cf.getNextFolio('hola', 'folio', { fieldName: 'id_cliente', fieldValue: "1" })
    .then(x => console.log(x))

    