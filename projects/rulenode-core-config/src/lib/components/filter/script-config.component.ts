import { Component, ViewChild } from '@angular/core';
import { AppState, NodeScriptTestService, getCurrentAuthState } from '@core/public-api';
import { JsFuncComponent, RuleNodeConfiguration, RuleNodeConfigurationComponent, ScriptLanguage } from '@shared/public-api';
import { Store } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'tb-filter-node-script-config',
  templateUrl: './script-config.component.html',
  styleUrls: []
})
export class ScriptConfigComponent extends RuleNodeConfigurationComponent {

  @ViewChild('jsFuncComponent', {static: false}) jsFuncComponent: JsFuncComponent;
  @ViewChild('tbelFuncComponent', {static: false}) tbelFuncComponent: JsFuncComponent;

  scriptConfigForm: FormGroup;

  tbelEnabled = getCurrentAuthState(this.store).tbelEnabled;

  scriptLanguage = ScriptLanguage;

  constructor(protected store: Store<AppState>,
              private fb: FormBuilder,
              private nodeScriptTestService: NodeScriptTestService,
              private translate: TranslateService) {
    super(store);
  }

  protected configForm(): FormGroup {
    return this.scriptConfigForm;
  }

  protected onConfigurationSet(configuration: RuleNodeConfiguration) {
    this.scriptConfigForm = this.fb.group({
      scriptLang: [configuration ? configuration.scriptLang : ScriptLanguage.JS, [Validators.required]],
      jsScript: [configuration ? configuration.jsScript : null, []],
      tbelScript: [configuration ? configuration.tbelScript : null, []]
    });
  }

  protected validatorTriggers(): string[] {
    return ['scriptLang'];
  }

  protected updateValidators(emitEvent: boolean) {
    let scriptLang: ScriptLanguage = this.scriptConfigForm.get('scriptLang').value;
    if (scriptLang === ScriptLanguage.TBEL && !this.tbelEnabled) {
      scriptLang = ScriptLanguage.JS;
      this.scriptConfigForm.get('scriptLang').patchValue(scriptLang, {emitEvent: false});
      setTimeout(() => {this.scriptConfigForm.updateValueAndValidity({emitEvent: true})});
    }
    this.scriptConfigForm.get('jsScript').setValidators(scriptLang === ScriptLanguage.JS ? [Validators.required] : []);
    this.scriptConfigForm.get('jsScript').updateValueAndValidity({emitEvent});
    this.scriptConfigForm.get('tbelScript').setValidators(scriptLang === ScriptLanguage.TBEL ? [Validators.required] : []);
    this.scriptConfigForm.get('tbelScript').updateValueAndValidity({emitEvent});
  }

  protected prepareInputConfig(configuration: RuleNodeConfiguration): RuleNodeConfiguration {
    if (configuration) {
      if (!configuration.scriptLang) {
        configuration.scriptLang = ScriptLanguage.JS;
      }
    }
    return configuration;
  }

  testScript() {
    const scriptLang: ScriptLanguage = this.scriptConfigForm.get('scriptLang').value;
    const scriptField = scriptLang === ScriptLanguage.JS ? 'jsScript' : 'tbelScript';
    const helpId = scriptLang === ScriptLanguage.JS ? 'rulenode/filter_node_script_fn' : 'rulenode/tbel/filter_node_script_fn';
    const script: string = this.scriptConfigForm.get(scriptField).value;
    this.nodeScriptTestService.testNodeScript(
      script,
      'filter',
      this.translate.instant('tb.rulenode.filter'),
      'Filter',
      ['msg', 'metadata', 'msgType'],
      this.ruleNodeId,
      helpId,
      scriptLang
    ).subscribe((theScript) => {
      if (theScript) {
        this.scriptConfigForm.get(scriptField).setValue(theScript);
      }
    });
  }

  protected onValidate() {
    const scriptLang: ScriptLanguage = this.scriptConfigForm.get('scriptLang').value;
    if (scriptLang === ScriptLanguage.JS) {
      this.jsFuncComponent.validateOnSubmit();
    }
  }
}
