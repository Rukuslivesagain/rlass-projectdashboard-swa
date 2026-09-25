/*
*This is auto generated from the ControlManifest.Input.xml file
*/

// Define IInputs and IOutputs Type. They should match with ControlManifest.
export interface IInputs {
    PCFModeViewType: ComponentFramework.PropertyTypes.StringProperty;
    PCFModeViewInfoJson: ComponentFramework.PropertyTypes.StringProperty;
    PCFModeViewIndex: ComponentFramework.PropertyTypes.WholeNumberProperty;
    PCFModeViewContextJson: ComponentFramework.PropertyTypes.StringProperty;
    PCFModeIncomingPayloadJson: ComponentFramework.PropertyTypes.StringProperty;
    PCFModeIncomingStatus: ComponentFramework.PropertyTypes.WholeNumberProperty;
    PCFModeOutgoingPayloadJson: ComponentFramework.PropertyTypes.StringProperty;
    PCFModeViewLoadingIsComplete: ComponentFramework.PropertyTypes.TwoOptionsProperty;
}
export interface IOutputs {
    PCFModeViewType?: string;
    PCFModeViewInfoJson?: string;
    PCFModeViewIndex?: number;
    PCFModeViewContextJson?: string;
    PCFModeIncomingPayloadJson?: string;
    PCFModeOutgoingPayloadJson?: string;
    PCFModeViewLoadingIsComplete?: boolean;
}
