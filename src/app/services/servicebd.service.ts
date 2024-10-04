import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { BehaviorSubject, Observable } from 'rxjs';
import { Noticias } from './noticias';
import { AlertController, Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ServicebdService {
  //creo mi variable de conexión a Base de Datos
  public database!: SQLiteObject;

  //variables de creación de tablas
  tablaNoticia: string = "CREATE TABLE IF NOT EXISTS noticia(idnoticia INTEGER PRIMARY KEY autoincrement, titulo VARCHAR(100) NOT NULL, texto TEXT NOT NULL);";

  //variables de insert iniciales de las tablas
  registroNoticia: string = "INSERT or IGNORE INTO noticia(idnoticia, titulo, texto) VALUES (1,'Soy un titulo de noticia', 'Soy un texto como contenido de la noticia recien creada');";

//observables para guardar las consultas de las tablas
listaNoticias = new BehaviorSubject([]);



//observable para manipular el estado de la base de datos
private isDBReady : BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(private sqlite: SQLite, private platform: Platform, private alertController: AlertController) { 
    this.crearConexion();
  }

  fetchNoticias(): Observable<Noticias[]>{
    return this.listaNoticias.asObservable();
  }
  
  dbReady(){
    return this.isDBReady.asObservable();
  }

  async presentAlert(titulo:string, msj:string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: msj,
      buttons: ['OK'],
    });

    await alert.present();
  }

  //funcion para crear la base de datos
  crearConexion(){
    //verificar la plataforma
    this.platform.ready().then(()=>{
      //crear bd
      this.sqlite.create({
        name: 'bdnoticis.bd',
        location: 'default'
      }).then((db: SQLiteObject)=>{
        //guardar conexion
        this.database = db;
        //llamar funcion de cracion de tablas
        this.crearTablas();
        this.buscarNoticias();
        //indicar que la bd esta lista
        this.isDBReady.next(true);
      }).catch(e=>{
        this.presentAlert('crear conexion', 'error en crear bd: ' + JSON.stringify(e));
      })

    });
  }

  async crearTablas(){
    try {
      //ejecutar la creacion de las tablas
      await this.database.executeSql(this.tablaNoticia,[]);

      //ejecutar unserts que existen
      await this.database.executeSql(this.registroNoticia, []);

    } catch (e) {
      this.presentAlert('crear tabla', 'error en crear tabla: ' + JSON.stringify(e));
    }
  }

  buscarNoticias(){
    return this.database.executeSql('SELECT * FROM noticia',[]).then(res => {
      //variable para guardar resultado de la consulta
      let items: Noticias[] = [];
      //verifica si la consulta trae registros 
      if(res.rows.length > 0){
        //recorro el cursor
        for(var i = 0; i < res.rows.length; i ++){
          items.push({
            idnoticia: res.rows.item(i).idnoticia,
            titulo: res.rows.item(i).titulo,
            texto: res.rows.item(i).texto})
        }
      }
      //actualizamos el observable de este select
      this.listaNoticias.next(items as any);
    })
  }

  insertarNoticia(titulo: string, texto: string){
    return this.database.executeSql('INSERT INTO noticia(titulo, texto) VALUES (?,?) ',
    [titulo,texto]).then(res=>{
      this.presentAlert("Insertar", "Noticia Agregada Correctamente!");
      this.buscarNoticias();
    }).catch(e=>{
      this.presentAlert('Insertar', 'Error: ' + JSON.stringify(e));
    })
  }

  eliminarNoticia(id:string){
    return this.database.executeSql('DELETE FROM noticia WHERE idnoticia = ?',[id]).then(res=>{
      this.presentAlert("Eliminar", "Noticia eliminada Correctamente!");
      this.buscarNoticias();
    }).catch(e=>{
      this.presentAlert('Eliminar', 'Error: ' + JSON.stringify(e));
    })
  }
  
  editarNoticia(id:string, titulo:string, texto: string){
    return this.database.executeSql('UPDATE noticia SET titulo = ?, texto = ? WHERE idnoticia = ?', [titulo, texto, id]).then(res=>{
      this.presentAlert("Modificar", "Noticia modificada Correctamente!");
      this.buscarNoticias();
    }).catch(e=>{
      this.presentAlert('Modificar', 'Error: ' + JSON.stringify(e));
    })
  }

}
