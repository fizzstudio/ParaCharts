## API Report File for "@fizz/paracharts"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { LitElement } from 'lit';
import { Manifest } from '@fizz/paramanifest';
import { PropertyValues } from 'lit';
import { Size2d } from '@fizz/chart-classifier-utils';
import { State } from '@lit-app/state';
import { StateController } from '@lit-app/state';
import { TemplateResult } from 'lit';
import { XyPoint } from '@fizz/paramanifest';

// Warning: (ae-forgotten-export) The symbol "ParaChart_base" needs to be exported by the entry point index.d.ts
//
// @public (undocumented)
export class ParaChart extends ParaChart_base {
    constructor();
    // (undocumented)
    connectedCallback(): void;
    // (undocumented)
    accessor filename: string;
    // (undocumented)
    protected firstUpdated(_changedProperties: PropertyValues): void;
    // (undocumented)
    render(): TemplateResult;
    // Warning: (ae-forgotten-export) The symbol "ParaStore" needs to be exported by the entry point index.d.ts
    //
    // (undocumented)
    protected _state: StateController<ParaStore>;
    // (undocumented)
    willUpdate(changedProperties: PropertyValues<this>): void;
}

// (No @packageDocumentation comment for this package)

```
