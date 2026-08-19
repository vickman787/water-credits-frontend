import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';

import { ProjectDetailComponent } from './project-detail';
import * as ProjectsActions from '../../../core/store/projects/projects.actions';
import * as SensorsActions from '../../../core/store/sensors/sensors.actions';
import {
  selectSelectedProject,
  selectProjectsLoading,
} from '../../../core/store/projects/projects.selectors';
import {
  selectLatestProjectReadings,
  selectSensorsLoading,
  selectSensorsError,
} from '../../../core/store/sensors/sensors.selectors';
import { Project, ProjectStatus } from '../../../core/models/project.model';

const mockProject: Project = {
  id: 'project-1',
  ownerId: 'owner-1',
  name: 'Willow Creek Wetland',
  description: 'A wetland restoration project.',
  latitude: 40.1234,
  longitude: -74.5678,
  methodology: 'VM0033',
  status: ProjectStatus.ACTIVE,
  areaHectares: 12.5,
  baselineStart: '2024-01-01',
  baselineEnd: '2024-06-01',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

function setup(options?: {
  project?: Project | null;
  projectLoading?: boolean;
  sensorReadings?: unknown[];
  sensorLoading?: boolean;
  sensorError?: string | null;
}) {
  const {
    project = mockProject,
    projectLoading = false,
    sensorReadings = [],
    sensorLoading = false,
    sensorError = null,
  } = options ?? {};

  TestBed.configureTestingModule({
    imports: [ProjectDetailComponent],
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectSelectedProject, value: project },
          { selector: selectProjectsLoading, value: projectLoading },
          { selector: selectLatestProjectReadings, value: sensorReadings },
          { selector: selectSensorsLoading, value: sensorLoading },
          { selector: selectSensorsError, value: sensorError },
        ],
      }),
      {
        provide: ActivatedRoute,
        useValue: { paramMap: of(convertToParamMap({ id: 'project-1' })) },
      },
    ],
  });

  const fixture = TestBed.createComponent(ProjectDetailComponent);
  const store = TestBed.inject(MockStore);
  const fixtureRef: { fixture: ComponentFixture<ProjectDetailComponent>; store: MockStore } = {
    fixture,
    store,
  };
  return fixtureRef;
}

describe('ProjectDetailComponent', () => {
  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('dispatches loadProject for the route id on init', () => {
    const { fixture, store } = setup();
    vi.spyOn(store, 'dispatch');
    fixture.detectChanges();

    expect(store.dispatch).toHaveBeenCalledWith(ProjectsActions.loadProject({ id: 'project-1' }));
  });

  describe('sensors tab', () => {
    it('dispatches loadLatestReadings the first time the Sensors tab is clicked', () => {
      const { fixture, store } = setup();
      fixture.detectChanges();
      store.dispatch = vi.fn();

      const sensorsTabButton = fixture.debugElement
        .queryAll(By.css('button'))
        .find((btn) => btn.nativeElement.textContent.includes('Sensors'))!;
      sensorsTabButton.nativeElement.click();
      fixture.detectChanges();

      expect(store.dispatch).toHaveBeenCalledWith(
        SensorsActions.loadLatestReadings({ projectId: 'project-1' }),
      );
    });

    it('does not dispatch loadLatestReadings again on a second click of the Sensors tab', () => {
      const { fixture, store } = setup();
      fixture.detectChanges();

      const sensorsTabButton = fixture.debugElement
        .queryAll(By.css('button'))
        .find((btn) => btn.nativeElement.textContent.includes('Sensors'))!;
      sensorsTabButton.nativeElement.click();
      fixture.detectChanges();

      store.dispatch = vi.fn();
      sensorsTabButton.nativeElement.click();
      fixture.detectChanges();

      expect(store.dispatch).not.toHaveBeenCalledWith(
        SensorsActions.loadLatestReadings({ projectId: 'project-1' }),
      );
    });

    it('renders the error from the store via app-loading-state when the sensor load fails', () => {
      const { fixture } = setup({ sensorError: 'Failed to load sensor readings' });
      fixture.detectChanges();

      const sensorsTabButton = fixture.debugElement
        .queryAll(By.css('button'))
        .find((btn) => btn.nativeElement.textContent.includes('Sensors'))!;
      sensorsTabButton.nativeElement.click();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Failed to load sensor readings');
    });

    it('shows the loading state while sensor readings are loading', () => {
      const { fixture } = setup({ sensorLoading: true });
      fixture.detectChanges();

      const sensorsTabButton = fixture.debugElement
        .queryAll(By.css('button'))
        .find((btn) => btn.nativeElement.textContent.includes('Sensors'))!;
      sensorsTabButton.nativeElement.click();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Loading sensor data...');
    });
  });
});
