import { Result, HttpManagerService } from '../http-manager/http-manager.service';
import { Injectable } from '@angular/core';
import { MainService } from '../main/main.service';
import { Project } from './project';
import { BehaviorSubject ,  Observable ,  of } from 'rxjs';
import { Main } from '../main/main';
import { NotifierService } from 'angular-notifier';
import { forEach, find, findIndex } from 'lodash';

@Injectable()
export class ProjectService {

  main: Main;

  constructor(
    private mainService: MainService,
    private httpManager: HttpManagerService,
    private readonly notifierService: NotifierService
  ) {
    // Sync with main object
    this.mainService.getMain().subscribe(main => this.main = main);
  }

  /** Get all project from database */
  public getProjects() {
    this.httpManager.get(this.main.hostAddres + '/api/projects').then((result: Result) => {
      // Iterate through all projects
      forEach(result.data, (project) => {
        this.main.projects.push(new Project(JSON.stringify(project)));
      });
      this.notifierService.notify(result.meta.status, result.meta.details[0]);
    });
  }

  /** Set current project in main object */
  public setCurrnetProject(projectId: number) {
    let project = find(this.main.projects, function (o) {
      return o.id == projectId;
    });
    this.main.currentProject = project;
  }

  /** Create new project */
  public createProject() {
    return this.httpManager.post(this.main.hostAddres + '/api/project', JSON.stringify({}));
  }

  /** Update project */
  public updateProject(projectId: number) {
    let project: Project = find(this.main.projects, function (o) { return o.id == projectId });
    this.httpManager.put(this.main.hostAddres + '/api/project/' + project.id, project.toJSON()).then((result: Result) => {
      this.notifierService.notify(result.meta.status, result.meta.details[0]);
    });

  }

  /** Delete project */
  public deleteProject(projectId: number) {
    return this.httpManager.delete(this.main.hostAddres + '/api/project/' + projectId);
  }

}
