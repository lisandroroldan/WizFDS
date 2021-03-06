import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';

import { Ramp } from '@services/fds-object/ramp/ramp';
import { UiStateService } from '@services/ui-state/ui-state.service';
import { MainService } from '@services/main/main.service';
import { Matl } from '@services/fds-object/geometry/matl';
import { UiState } from '@services/ui-state/ui-state';
import { Fds } from '@services/fds-object/fds-object';
import { Main } from '@services/main/main';
import { LibraryService } from '@services/library/library.service';
import { Library } from '@services/library/library';
import { IdGeneratorService } from '@services/id-generator/id-generator.service';

import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';
import { set, cloneDeep, find, findIndex, filter } from 'lodash';

@Component({
  selector: 'app-material',
  templateUrl: './material.component.html',
  styleUrls: ['./material.component.scss']
})
export class MaterialComponent implements OnInit, OnDestroy {

  // Global objects
  main: Main;
  fds: Fds;
  geometry: any;
  ui: UiState;
  lib: Library;

  // Component objects
  matls: Matl[];
  libMatls: Matl[];
  matl: Matl;
  matlOld: Matl;
  ramps: Ramp[];
  libRamps: Ramp[];
  objectType: string = 'current'; // Lib or current

  mainSub;
  uiSub;
  libSub;

  // Scrolbars containers
  @ViewChild('matlScrollbar') matlScrollbar: PerfectScrollbarComponent;
  @ViewChild('libMatlScrollbar') libMatlScrollbar: PerfectScrollbarComponent;

  constructor(
    private mainService: MainService,
    private uiStateService: UiStateService,
    private libraryService: LibraryService
  ) { }

  ngOnInit() {
    console.clear();
    // Subscribe main object
    this.mainSub = this.mainService.getMain().subscribe(main => this.main = main);
    this.uiSub = this.uiStateService.uiObservable.subscribe(uiObservable => this.ui = uiObservable);
    this.libSub = this.libraryService.getLibrary().subscribe(lib => this.lib = lib);

    // Assign to local variables
    this.fds = this.main.currentFdsScenario.fdsObject;
    this.geometry = this.main.currentFdsScenario.fdsObject.geometry;
    this.matls = this.main.currentFdsScenario.fdsObject.geometry.matls;
    this.libMatls = this.lib.matls;
    this.ramps = filter(this.main.currentFdsScenario.fdsObject.ramps.ramps, function(o) { return o.type == 'matl' });
    this.libRamps = filter(this.lib.ramps, function(o) { return o.type == 'matl' });

    // Activate last element
    this.matls.length > 0 ? this.matl = this.matls[this.ui.geometry['matl'].elementIndex] : this.matl = undefined;
  }

  ngAfterViewInit() {
    // Set scrollbars position y after view rendering and set last selected element
    this.matlScrollbar.directiveRef.scrollToY(this.ui.geometry['matl'].scrollPosition);
    this.matls.length > 0 && this.activate(this.matls[this.ui.geometry['matl'].elementIndex].id);
  }

  ngOnDestroy() {
    this.libSub.unsubscribe();
    this.mainSub.unsubscribe();
    this.uiSub.unsubscribe();
  }

  /** Activate element on click */
  public activate(id: string, library?: boolean) {
    if (!library) {
      this.objectType = 'current';
      this.matl = find(this.fds.geometry.matls, function (o) { return o.id == id; });
      this.ui.geometry['matl'].elementIndex = findIndex(this.matls, { id: id });
      this.matlOld = cloneDeep(this.matl);
    }
    else {
      this.objectType = 'library';
      this.matl = find(this.lib.matls, function (o) { return o.id == id; });
      this.ui.geometry['libMatl'].elementIndex = findIndex(this.libMatls, { id: id });
      this.matlOld = cloneDeep(this.matl);
    }
  }

  /** Push new element */
  public add(library?: boolean) {
    // Create new matl object with unique id
    if (!library) {
      let element = { id: 'MATL' + this.mainService.getListId(this.matls) };
      this.matls.push(new Matl(JSON.stringify(element), this.ramps));
      this.activate(element.id);
    }
    else {
      let element = { id: 'MATL' + this.mainService.getListId(this.libMatls) };
      this.libMatls.push(new Matl(JSON.stringify(element), this.libRamps));
      this.activate(element.id, true);
    }
  }

  /** Delete element */
  public delete(id: string, library?: boolean) {
    if (!library) {
      let index = findIndex(this.matls, { id: id });
      this.matls.splice(index, 1);
      if (index != 0) {
        this.matls.length == 0 ? this.matl = undefined : this.activate(this.matls[index - 1].id);
      }
      else {
        this.matls.length == 0 ? this.matl = undefined : this.activate(this.matls[index].id);
      }
    }
    else {
      let index = findIndex(this.libMatls, { id: id });
      this.libMatls.splice(index, 1);
      if (index != 0) {
        this.libMatls.length == 0 ? this.matl = undefined : this.activate(this.libMatls[index - 1].id, true);
      }
      else {
        this.libMatls.length == 0 ? this.matl = undefined : this.activate(this.libMatls[index].id, true);
      }
    }
  }

  /** Update scroll position */
  public scrollbarUpdate(element: string) {
    set(this.ui.geometry, element + '.scrollPosition', this[element + 'Scrollbar'].directiveRef.geometry().y);
  }

  /** Update CAD element */
  public updateCad() {
    this.matlOld = cloneDeep(this.matl);
  }

  /** Toggle library */
  public toggleLibrary() {
    this.ui.geometry['matl'].lib == 'closed' ? this.ui.geometry['matl'].lib = 'opened' : this.ui.geometry['matl'].lib = 'closed';
  }

  /** Import from library */
  public importLibraryItem(id: string) {
    let idGeneratorService = new IdGeneratorService;
    let libMatl = find(this.lib.matls, function (o) { return o.id == id; });
    let ramp = undefined;
    let libRamp = undefined;
    // Import ramps if exists
    if (libMatl.conductivity_ramp != undefined && libMatl.conductivity_ramp.id) {
      // Check if ramp already exists
      libRamp = find(this.ramps, function (o) { return o.id == libMatl.conductivity_ramp.id });
      // If ramp do not exists import from library
      if (libRamp == undefined) {
        libRamp = find(this.lib.ramps, function (o) { return o.id == libMatl.conductivity_ramp.id });
        ramp = cloneDeep(libRamp);
        ramp.uuid = idGeneratorService.genUUID();
        this.main.currentFdsScenario.fdsObject.ramps.ramps.push(ramp);
        this.ramps = filter(this.main.currentFdsScenario.fdsObject.ramps.ramps, function(o) { return o.type == 'matl' });
      }
    }
    if (libMatl.specific_heat_ramp != undefined && libMatl.specific_heat_ramp.id) {
      // Check if ramp already exists
      libRamp = find(this.ramps, function (o) { return o.id == libMatl.specific_heat_ramp.id });
      // If ramp do not exists import from library
      if (libRamp == undefined) {
        libRamp = find(this.lib.ramps, function (o) { return o.id == libMatl.specific_heat_ramp.id });
        ramp = cloneDeep(libRamp);
        ramp.uuid = idGeneratorService.genUUID();
        this.main.currentFdsScenario.fdsObject.ramps.ramps.push(ramp);
        this.ramps = filter(this.main.currentFdsScenario.fdsObject.ramps.ramps, function(o) { return o.type == 'matl' });
      }
    }
    let matl = cloneDeep(libMatl);
    matl.uuid = idGeneratorService.genUUID();
    if (libMatl.specific_heat_ramp != undefined && libMatl.specific_heat_ramp.id) matl.specific_heat_ramp = ramp != undefined ? ramp : libRamp;
    if (libMatl.conductivity_ramp != undefined && libMatl.conductivity_ramp.id) matl.conductivity_ramp = ramp != undefined ? ramp : libRamp;
    this.matls.push(matl);
  }

  // COMPONENT METHODS
  /** Add ramp and activate */
  public addRamp(type: string, property?: string) {
    // Chcek if current or library
    if (this.objectType == 'current') {
      let element = { id: 'RAMP' + this.mainService.getListId(this.main.currentFdsScenario.fdsObject.ramps.ramps), type: type };
      this.main.currentFdsScenario.fdsObject.ramps.ramps.push(new Ramp(JSON.stringify(element)));
      this.ramps = filter(this.main.currentFdsScenario.fdsObject.ramps.ramps, function(o) { return o.type == 'matl' });
      if (property == 'conductivity') {
        this.matl.conductivity_ramp = find(this.ramps, (ramp) => {
          return ramp.id == element.id;
        });
      }
      else if (property == 'specific_heat') {
        this.matl.specific_heat_ramp = find(this.ramps, (ramp) => {
          return ramp.id == element.id;
        });
      }
    }
    else if (this.objectType == 'library') {
      let element = { id: 'RAMP' + this.mainService.getListId(this.lib.ramps), type: type };
      this.lib.ramps.push(new Ramp(JSON.stringify(element)));
      this.libRamps = filter(this.lib.ramps, function(o) { return o.type == 'matl' });
      if (property == 'conductivity') {
        this.matl.conductivity_ramp = find(this.libRamps, (ramp) => {
          return ramp.id == element.id;
        });
      }
      else if (property == 'specific_heat') {
        this.matl.specific_heat_ramp = find(this.libRamps, (ramp) => {
          return ramp.id == element.id;
        });
      }
    }
  }


}
