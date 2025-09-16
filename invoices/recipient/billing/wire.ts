import { IBilling } from "./billing.interface";
import { Result } from "../../../building-blocks";

export class Wire
    implements
        IBilling<
            "WIRE",
            {
                swift: string;
                accountNumber: string;
                accountHolderName: string;
                bankName: string;
                bankAddress: string;
                bankCountry: string;
            }
        >
{
    public readonly type = "WIRE" as const;
    public readonly data: {
        swift: string;
        accountNumber: string;
        accountHolderName: string;
        bankName: string;
        bankAddress: string;
        bankCountry: string;
    };

    private constructor(data: {
        swift: string;
        accountNumber: string;
        accountHolderName: string;
        bankName: string;
        bankAddress: string;
        bankCountry: string;
    }) {
        this.data = data;
    }

    static create(data: {
        swift: string;
        accountNumber: string;
        accountHolderName: string;
        bankName: string;
        bankAddress: string;
        bankCountry: string;
    }) {
        return Result.ok(new Wire(data));
    }
}
