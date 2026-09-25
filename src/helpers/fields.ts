// =====================================================
// P6 Activity Fields
// =====================================================

// =====================================================
// P6 Activity Fields
// =====================================================

export enum ActivityField {

    ACT_SystemId =
        "rlass_aa_tblp6act_systemid",

    ACT_ActivityId =
        "rlass_aa_tblp6act_activity_id",

    ACT_ActivityName =
        "rlass_aa_tblp6act_activity_name",

    ACT_ActivityStatus =
        "rlass_aa_tblp6act_activity_status",

    ACT_ActivityType =
        "rlass_aa_tblp6act_activity_type",

    ACT_ActualDuration =
        "rlass_aa_tblp6act_actual_duration",

    ACT_ActualLaborUnits =
        "rlass_aa_tblp6act_actual_labor_units",

    ACT_BL1Duration =
        "rlass_aa_tblp6act_bl1_duration",

    ACT_BL1Finish =
        "rlass_aa_tblp6act_bl1_finish",

    ACT_BL1LaborUnits =
        "rlass_aa_tblp6act_bl1_labor_units",

    ACT_BL1Start =
        "rlass_aa_tblp6act_bl1_start",

    ACT_BudgetedLaborUnits =
        "rlass_aa_tblp6act_budgeted_labor_units",

    ACT_Critical =
        "rlass_aa_tblp6act_critical",

    ACT_CVXActivityPriority =
        "rlass_aa_tblp6act_cvx_activity_priority",

    ACT_CVXEquipNumberPriority =
        "rlass_aa_tblp6act_cvx_equip_number_priority",

    ACT_CVXHighRiskJob =
        "rlass_aa_tblp6act_cvx_high_risk_job",

    ACT_CVXMilestoneType =
        "rlass_aa_tblp6act_cvx_milestone_type",

    ACT_CVXOpsSystemReturnPriority =
        "rlass_aa_tblp6act_cvx_ops_system_return_prior",

    ACT_CVXPhase =
        "rlass_aa_tblp6act_cvx_phase",

    ACT_CVXProjectType =
        "rlass_aa_tblp6act_cvx_project_type",

    ACT_CVXTAW =
        "rlass_aa_tblp6act_cvx_taw",

    ACT_DataDate =
        "rlass_aa_tblp6act_datadate",

    ACT_DataSetRowIndexNumber =
        "rlass_aa_tblp6act_datasetrowindexnumber",

    ACT_EISalesforceDowntimeId =
        "rlass_aa_tblp6act_ei_salesforce_downtime_id",

    ACT_EISalesforceDowntimeTitle =
        "rlass_aa_tblp6act_ei_salesforce_downtime_titl",

    ACT_EISalesforceFacilityArea =
        "rlass_aa_tblp6act_ei_salesforce_facility_area",

    ACT_EISalesforcePlanningIdentifier =
        "rlass_aa_tblp6act_ei_salesforce_planning_iden",

    ACT_EISalesforceScopeIdentifier =
        "rlass_aa_tblp6act_ei_salesforce_scope_identif",

    ACT_Finish =
        "rlass_aa_tblp6act_finish",

    ACT_FreeFloat =
        "rlass_aa_tblp6act_free_float",

    ACT_OriginalDuration =
        "rlass_aa_tblp6act_original_duration",

    ACT_Predecessors =
        "rlass_aa_tblp6act_predecessors",

    ACT_PrimaryConstraint =
        "rlass_aa_tblp6act_primary_constraint",

    ACT_PrimaryConstraintDate =
        "rlass_aa_tblp6act_primary_constraint_date",

    ACT_Project =
        "rlass_aa_tblp6act_prjc_project",

    ACT_ProjectWBSClass =
        "rlass_aa_tblp6act_prjc_wbs_class",

    ACT_RemainingDuration =
        "rlass_aa_tblp6act_remaining_duration",

    ACT_RemainingLaborUnits =
        "rlass_aa_tblp6act_remaining_labor_units",

    ACT_ResourceIds =
        "rlass_aa_tblp6act_resource_ids",

    ACT_Resources =
        "rlass_aa_tblp6act_resources",

    ACT_ScheduleDataType =
        "rlass_aa_tblp6act_scheduledatatype",

    ACT_Start =
        "rlass_aa_tblp6act_start",

    ACT_Successors =
        "rlass_aa_tblp6act_successors",

    ACT_TotalFloat =
        "rlass_aa_tblp6act_total_float",

    ACT_UploadDate =
        "rlass_aa_tblp6act_uploaddate",

    ACT_WBS =
        "rlass_aa_tblp6act_wbs",

    ACT_WBSCategory =
        "rlass_aa_tblp6act_wbs_category",

    ACT_WBSName =
        "rlass_aa_tblp6act_wbs_name",

    ACT_WBSPath =
        "rlass_aa_tblp6act_wbs_path"

}

export interface FieldsRegistryField {

    name:
        string;

    lookupKey:
        string | null;

    displayName:
        string;

    canonicalName:
        string;

    modelJsonName?:
        string;

    dataType:
        string;

    group:
        string;

    required:
        boolean;

}

export interface FieldsRegistryDataset {

    modelJsonEntityName?:
        string;

    fields:
        FieldsRegistryField[];

}

export interface FieldsRegistry {

    registryType:
        string;

    schemaVersion:
        number;

    currentVersion:
        number;

    lastModified:
        string;

    activities:
        FieldsRegistryDataset;

    resources:
        FieldsRegistryDataset;

    worklist:
        FieldsRegistryDataset;

}


// =====================================================
// P6 Resource Fields
// =====================================================

// =====================================================
// P6 Resource Fields
// =====================================================

export enum ResourceField {

    RES_ActivityId =
        "rlass_aa_tblp6res_activity_id",

    RES_CVXCompany =
        "rlass_aa_tblp6res_cvx_company",

    RES_CVXCraftType =
        "rlass_aa_tblp6res_cvx_craft_type",

    RES_DataDate =
        "rlass_aa_tblp6res_datadate",

    RES_Date =
        "rlass_aa_tblp6res_date",

    RES_ResourceId =
        "rlass_aa_tblp6res_resource_id",

    RES_ResourceIdName =
        "rlass_aa_tblp6res_resource_id_name",

    RES_ResourceName =
        "rlass_aa_tblp6res_resource_name",

    RES_ResourceType =
        "rlass_aa_tblp6res_resource_type",

    RES_ScheduleDataType =
        "rlass_aa_tblp6res_scheduledatatype",

    RES_UnitType =
        "rlass_aa_tblp6res_unit_type",

    RES_Units =
        "rlass_aa_tblp6res_units",

    RES_UploadDate =
        "rlass_aa_tblp6res_uploaddate",

    RES_DataSetRowIndexNumber =
        "rlass_aa_tblp6res_datasetrowindexnumber",

    RES_SystemId =
        "rlass_aa_tblp6datares_systemid"

}