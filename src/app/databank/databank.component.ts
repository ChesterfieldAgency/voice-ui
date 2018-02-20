import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { DatabankService, Result, Metric, MetricType, MetricTypes, Query, DialogFlowResponse } from './databank.service';

@Component({
  selector: 'app-databank',
  templateUrl: './databank.component.html',
  styleUrls: ['./databank.component.css'],
  providers: [
    DatabankService
  ]
})
export class DatabankComponent implements OnInit {
  metric: MetricType;
  subscription: AngularFireList<any[]>;
  query = new Query();
  metrics = new MetricTypes();
  items: Metric[] = [];
  init: boolean = false;
  loading: boolean = false;
  result: Result;
  command: string = '';
  mode: string = 'list';
  scheme = {
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };
  page: number = 1;
  recognition: SpeechRecognition = new webkitSpeechRecognition();
  listening = false;
  error = false;

  constructor(
    private db: AngularFireDatabase,
    private databankService: DatabankService
  ) {}

  // Setup the subscription on init
  ngOnInit() {
    this.db.list('requests', ref =>
      ref.orderByChild('timestamp').limitToLast(1)
    ).valueChanges().subscribe((res: DialogFlowResponse[]) => {
      console.log('result', res);
      if (res[0] && res[0].result.action === 'databank-display') {
        const result = res[0].result;

        this.metric = this.metrics[result.parameters.metric];
        if (this.init) {
          this.result = result;

          if (result.actionIncomplete) {
            this.error = true;
            return;
          }
          
          this.loading = true;

          setTimeout(() => {
            if (result.parameters.country) {
              this.items = this.databankService.queryCountry(this.metric.code, result.parameters.country['alpha-3']);
              result.parameters.display = 'chart';
            } else {
              this.items = this.databankService.queryAll(
                this.metric.code,
                result.parameters.relative,
                result.parameters.limit || 20
              );
            }
            this.page = 1;
            this.loading = false;
            this.mode = (result.parameters.display) ? result.parameters.display : 'list';
          }, 3000);
        }
        this.init = true;
      }
    });
  }

  onCommand(event) {
    event.preventDefault();
    this.databankService.command(this.command).subscribe(response => {
      this.command = '';
    });
  }

  try(event) {
    this.command = event.target.innerText;
    this.onCommand(event);
  }

  toggleMode() {
    if (this.mode === 'list') {
      this.mode = 'chart';
    } else {
      this.mode = 'list';
    }
  }

  

  request() {
    if (this.listening) {
      this.recognition.abort();
      this.listening = false;
      return;
    }

    this.recognition.onstart = (event) => {
      this.listening = true;
    };
    this.recognition.onresult = (event) => {
      this.listening = false;
      this.command = event.results[0][0].transcript;
      this.databankService.command(this.command).subscribe(response => {
        this.command = '';
      });
    };
    this.recognition.start();
  }
}
