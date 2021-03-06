import { Component, OnInit, OnDestroy, isDevMode } from '@angular/core';

import { Main } from '@services/main/main';
import { MainService } from '@services/main/main.service';
import { WebsocketService } from '@services/websocket/websocket.service';
import { FdsScenarioService } from '@services/fds-scenario/fds-scenario.service';
import { Library } from '@services/library/library';
import { LibraryService } from '@services/library/library.service';
import { UiState } from '@services/ui-state/ui-state';
import { UiStateService } from '@services/ui-state/ui-state.service';
import { JsonFdsService } from '@services/json-fds/json-fds.service';
import { WebsocketMessageObject } from '@services/websocket/websocket-message';

import { saveAs } from 'file-saver';
import { join } from 'lodash';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {

  main: Main;
  lib: Library;
  uiState: UiState;
  websocket: WebsocketService;

  mainSub;
  uiSub;
  libSub;

  constructor(
    private mainService: MainService,
    private websocketService: WebsocketService,
    private fdsScenarioService: FdsScenarioService,
    private uiStateService: UiStateService,
    private libraryService: LibraryService,
    private jsonFdsService: JsonFdsService
  ) { }

  ngOnInit() {
    this.mainSub = this.mainService.getMain().subscribe(main => this.main = main);
    this.uiSub = this.uiStateService.uiObservable.subscribe(uiObservable => this.uiState = uiObservable);

    setTimeout(() => {
      this.libSub = this.libraryService.getLibrary().subscribe(lib => this.lib = lib);
      this.connectCad();
    }, 1000)
    this.websocket = this.websocketService;
  }

  ngOnDestroy() {
    this.mainSub.unsubscribe();
    this.uiSub.unsubscribe();
    this.libSub.unsubscribe();
  }

  public showDiagnosticData() {
    if (isDevMode()) {
      console.clear();
      console.log("======== Diagnostic ========");
      console.log("--- Main -------------------");
      console.log(this.main);
      console.log("--- Current fds scenario ---");
      console.log(this.main.currentFdsScenario);
      console.log("--- Library ---");
      console.log(this.lib);
      console.log("======== End Diagnostic ========");
    }
  }

  public setCurrentFdsScenario(projectId: number, fdsScenarioId: number) {
    this.fdsScenarioService.setCurrentFdsScenario(projectId, fdsScenarioId).subscribe();
  }

  /**
   * Update FDS sceanrio
   * @param projectId 
   * @param fdsScenarioId 
   */
  public updateFdsScenario(projectId: number, fdsScenarioId: number) {
    this.fdsScenarioService.updateFdsScenario(projectId, fdsScenarioId);
  }

  /** Update FDS library */
  public updateFdsLibrary() {
    this.libraryService.updateLibrary();
  }

  /** Connect to CAD */
  public connectCad() {
    if (!this.websocketService.isConnected) {
      this.websocketService.dataStream.subscribe(
        (data) => { },
        (err) => { console.log(err); },
        () => { console.log("Websocket disconnected ..."); }
      );
    }
    else {
      this.websocketService.dataStream.unsubscribe();
      this.websocketService.ws.close();
    }
  }

  /** Log-out from app */
  public logOut() {
    window.location.href = this.main.hostAddres + '/logout';
  }

  /**
   * Change current highlighted menu item
   * @param option Menu item
   */
  public activate(option: string) {
    this.uiState.active = option;
  }

  /**
   * Download fds input file
   */
  public downloadFdsInputFile() {
    let input = join(this.jsonFdsService.json2fds(this.main.currentFdsScenario.fdsObject), '\n');
    let blob = new Blob([input], { type: "text/plain;charset=utf-8" });
    saveAs(blob, this.main.currentFdsScenario.name + ".fds");
  }

  /**
   * Get CAD geometry
   */
  public getCadGeometryWeb() {
    let message: WebsocketMessageObject = {
      method: 'getCadGeometryWeb',
      data: {},
      id: this.websocketService.idGenerator(),
      requestID: '',
      status: 'succes'
    }
    this.websocketService.sendMessage(message);
  }

}
