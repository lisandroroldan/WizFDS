import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';

import { Main } from '@services/main/main';
import { Fds } from '@services/fds-object/fds-object';
import { UiState } from '@services/ui-state/ui-state';
import { Library } from '@services/library/library';
import { Fuel } from '@services/fds-object/fire/fuel';
import { MainService } from '@services/main/main.service';
import { UiStateService } from '@services/ui-state/ui-state.service';
import { LibraryService } from '@services/library/library.service';
import { Spec } from '@services/fds-object/specie/spec';
import { IdGeneratorService } from '@services/id-generator/id-generator.service';
import { FdsEnums } from '@enums/fds/enums/fds-enums';

import { NotifierService } from 'angular-notifier';
import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';
import { findIndex, find, cloneDeep, set, remove } from 'lodash';

@Component({
  selector: 'app-fuel',
  templateUrl: './fuel.component.html',
  styleUrls: ['./fuel.component.scss']
})
export class FuelComponent implements OnInit, OnDestroy {

  // Global objects
  main: Main;
  fds: Fds;
  ui: UiState;
  lib: Library;

  // Component objects
  fuels: Fuel[];
  libFuels: Fuel[];
  fuel: Fuel;
  fuelOld: Fuel;
  specs: Spec[];
  libSpecs: Spec[];
  objectType: string = 'current'; // Lib or current

  // Enums
  RADCALS = FdsEnums.FIRE.radcals;

  mainSub;
  uiSub;
  libSub;

  // Scrolbars containers
  @ViewChild('fuelScrollbar') fuelScrollbar: PerfectScrollbarComponent;
  @ViewChild('libFuelScrollbar') libFuelScrollbar: PerfectScrollbarComponent;

  constructor(
    private mainService: MainService,
    private uiStateService: UiStateService,
    private libraryService: LibraryService,
    private readonly notifierService: NotifierService
  ) { }

  ngOnInit() {
    console.clear();
    // Subscribe main object
    this.mainSub = this.mainService.getMain().subscribe(main => this.main = main);
    this.uiSub = this.uiStateService.uiObservable.subscribe(uiObservable => this.ui = uiObservable);
    this.libSub = this.libraryService.getLibrary().subscribe(lib => this.lib = lib);

    // Assign to local variables
    this.fds = this.main.currentFdsScenario.fdsObject;
    this.fuels = this.main.currentFdsScenario.fdsObject.fires.fuels;
    this.libFuels = this.lib.fuels;
    this.specs = this.main.currentFdsScenario.fdsObject.specie.specs;
    this.libSpecs = this.lib.specs;

    // Activate last element
    this.fuels.length > 0 ? this.fuel = this.fuels[this.ui.fires['fuel'].elementIndex] : this.fuel = undefined;

  }

  ngAfterViewInit() {
    // Set scrollbars position y after view rendering and set last selected element
    this.fuelScrollbar.directiveRef.scrollToY(this.ui.fires['fuel'].scrollPosition);
    this.fuels.length > 0 && this.activate(this.fuels[this.ui.fires['fuel'].elementIndex].id);
  }

  ngOnDestroy() {
    this.mainSub.unsubscribe();
    this.uiSub.unsubscribe();
    this.libSub.unsubscribe();
  }

  /** Activate element on click */
  public activate(id: string, library?: boolean) {
    if (!library) {
      this.objectType = 'current';
      this.fuel = find(this.fds.fires.fuels, function (o) { return o.id == id; });
      this.ui.fires['fuel'].elementIndex = findIndex(this.fuels, { id: id });
      this.fuelOld = cloneDeep(this.fuel);
    }
    else {
      this.objectType = 'library';
      this.fuel = find(this.lib.fuels, function (o) { return o.id == id; });
      this.ui.fires['libFuel'].elementIndex = findIndex(this.libFuels, { id: id });
      this.fuelOld = cloneDeep(this.fuel);
    }
  }

  /** Push new element */
  public add(library?: boolean) {
    // Create new fire object with unique id
    if (!library) {
      if (this.fuels.length < 1) {
        let element = { id: 'FUEL' + this.mainService.getListId(this.fuels, 'fuel') };
        this.fuels.push(new Fuel(JSON.stringify(element), this.specs));
        this.activate(element.id);
      }
      else {
        this.notifierService.notify('warning', 'You can specify only one fuel');
      }
    }
    else {
      let element = { id: 'FUEL' + this.mainService.getListId(this.libFuels, 'fuel') };
      this.libFuels.push(new Fuel(JSON.stringify(element), this.libSpecs));
      this.activate(element.id, true);
    }
  }

  /** Delete element */
  public delete(id: string, library?: boolean) {
    if (!library) {
      let index = findIndex(this.fuels, { id: id });
      this.fuels.splice(index, 1);
      if (index != 0) {
        this.fuels.length == 0 ? this.fuel = undefined : this.activate(this.fuels[index - 1].id);
      }
      else {
        this.fuels.length == 0 ? this.fuel = undefined : this.activate(this.fuels[index].id);
      }
    }
    else {
      let index = findIndex(this.libFuels, { id: id });
      this.libFuels.splice(index, 1);
      if (index != 0) {
        this.libFuels.length == 0 ? this.fuel = undefined : this.activate(this.libFuels[index - 1].id, true);
      }
      else {
        this.libFuels.length == 0 ? this.fuel = undefined : this.activate(this.libFuels[index].id, true);
      }
    }
  }

  /** Update scroll position */
  public scrollbarUpdate(element: string) {
    set(this.ui.fires, element + '.scrollPosition', this[element + 'Scrollbar'].directiveRef.geometry().y);
  }

  /** Toggle library */
  public toggleLibrary() {
    this.ui.fires['fuel'].lib == 'closed' ? this.ui.fires['fuel'].lib = 'opened' : this.ui.fires['fuel'].lib = 'closed';
  }

  /** Import from library */
  public importLibraryItem(id: string) {
    let idGeneratorService = new IdGeneratorService;
    let libFuel = find(this.lib.fuels, function (o) { return o.id == id; });
    let spec = undefined;
    let libSpec = undefined;
    if (libFuel.spec != undefined && libFuel.spec.id) {
      // Check if pec already exists
      libSpec = find(this.specs, function (o) { return o.id == libFuel.spec.id });
      // If ramp do not exists import from library
      if (libSpec == undefined) {
        libSpec = find(this.lib.specs, function (o) { return o.id == libFuel.spec.id });
        spec = cloneDeep(libSpec);
        spec.uuid = idGeneratorService.genUUID();
        this.specs.push(spec);
      }
    }
    let fuel = cloneDeep(libFuel);
    fuel.uuid = idGeneratorService.genUUID()
    fuel.spec = spec != undefined ? spec : libSpec;
    remove(this.fuels);
    this.fuels.push(fuel);
    this.activate(this.fuels[0].id);
  }

  // COMPONENT METHODS

}
