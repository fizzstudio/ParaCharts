
/** @internal */
export class ProportionalDataBinner {

    private total!: number;
    private _letters: LabeledCandidate[] = [];
    private _proportions: LabeledData[] = [];
    protected _returnString: string = ''
    protected labeledData: LabeledData[] = [];
    constructor(public readonly labeledDataString: string, public readonly binCount: number) {
        this.init()
    }

    get returnString() {
        return this._returnString
    }

    private init() {
        this.labeledData = JSON.parse(this.labeledDataString)
        this.labeledData.sort((a, b) => b.value - a.value)
        this.findTotal()
        for (let datapoints of this.labeledData) {
            this.findCandidateLetter(datapoints.label)
        }
        this.assignProportions()
        this.composeString()
    }

    private findTotal() {
        let total = 0
        for (let d of this.labeledData) {
            total += d.value
        }
        this.total = total
    }

    findCandidateLetter(label: string) {
        const currentCandidates = [];
        if (this._letters) {
            for (let labeledCandidate of this._letters) {
                currentCandidates.push(labeledCandidate.candidate)
            }
        }
        let i = 0;
        let candidate = label[0].toUpperCase();
        const labelStripped = label.replace(/\s+/g, '');
        const firstLetters = [...label.matchAll(/\s(\w)/g)];
        const firstLettersString = String(firstLetters.map(match => match[1]).join(''));
        while (currentCandidates.includes(labelStripped[i].toUpperCase())) {
            if (firstLetters.length > 0) {
                if (!currentCandidates.includes(firstLettersString[0].toUpperCase())){
                    candidate = firstLettersString[0].toUpperCase();
                    break
                }
            }
            i += 1;
            candidate = labelStripped[i].toUpperCase();
            if (i > labelStripped.length) {
                candidate = "?"
                break
            }
        }
        this._letters.push({ label: label, candidate: candidate });
    }

    assignProportions() {
        let total = this.binCount;
        for (let i = this.labeledData.length - 1; i > -1; i--) {
            let data = this.labeledData[i]
            const proportion = data.value / this.total
            let share = Math.max(1, Math.round(proportion * this.binCount))
            if (this.labeledData[0] == data) {
                share = total;
            }
            const letter = this._letters.filter(l => l.label == data.label)[0].candidate
            this._proportions.push({ label: letter, value: share })
            total -= share;
        }
        this._proportions.sort((a, b) => b.value - a.value)
    }

    composeString() {
        for (let data of this._proportions) {
            this._returnString = this._returnString.concat(data.label.repeat(data.value))
        }
    }
}


type LabeledData = {
    label: string,
    value: number
}

type LabeledCandidate = {
    label: string,
    candidate: string
}