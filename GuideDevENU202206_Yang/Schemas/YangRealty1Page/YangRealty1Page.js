define("YangRealty1Page", ["RightUtilities","ServiceHelper"], function(RightUtilities,ServiceHelper) {
	return {
		entitySchemaName: "YangRealty",
		attributes: {
			"HasAccessToManager": {
				"dataValueType": Terrasoft.DataValueType.BOOLEAN,
				"type": Terrasoft.ViewModelColumnType.VIRTUAL_COLUMN,
				"value": false
			},
			"CommissionUSD": {
				"dataValueType": Terrasoft.DataValueType.FLOAT,
				"type": Terrasoft.ViewModelColumnType.VIRTUAL_COLUMN,
				"value": 0.00,
				dependencies: [
                    {
                        columns: ["YangPriceUSD", "YangOfferType"],
                        methodName: "calculateCommission"
                    }
                ]
			},
			"YangOfferType":{
				lookupListConfig:{
					columns:["YangCommissionCoeff"]
				},
			},
			"YangManager": {
				dataValueType: Terrasoft.DataValueType.LOOKUP,
				lookupListConfig: {
					filter: function() {
						var activeUserFilter =
							this.Terrasoft.createColumnFilterWithParameter(this.Terrasoft.ComparisonType.EQUAL,
							"[SysAdminUnit:Contact:Id].Active", true);
						return activeUserFilter;
					}				
				}
		    },
		},
		modules: /**SCHEMA_MODULES*/{}/**SCHEMA_MODULES*/,
		details: /**SCHEMA_DETAILS*/{
			"Files": {
				"schemaName": "FileDetailV2",
				"entitySchemaName": "YangRealtyFile",
				"filter": {
					"masterColumn": "Id",
					"detailColumn": "YangRealty"
				}
			},
			"YangSchema26b8cca2Detailac7c0d7b": {
				"schemaName": "YangRealtyVisitDetail",
				"entitySchemaName": "YangRealtyVisit",
				"filter": {
					"detailColumn": "YangParentRealty",
					"masterColumn": "Id"
				}
			}
		}/**SCHEMA_DETAILS*/,
		businessRules: /**SCHEMA_BUSINESS_RULES*/{
			"YangComment": {
				"a1aaff48-9f47-4df5-8048-42a8474f4e8d": {
					"uId": "a1aaff48-9f47-4df5-8048-42a8474f4e8d",
					"enabled": true,
					"removed": false,
					"ruleType": 0,
					"property": 0,
					"logical": 0,
					"conditions": [
						{
							"comparisonType": 2,
							"leftExpression": {
								"type": 1,
								"attribute": "YangOfferType"
							}
						}
					]
				}
			},
			"YangManager": {
				"b02a70ed-68a0-474f-aefc-c19507077e9b": {
					"uId": "b02a70ed-68a0-474f-aefc-c19507077e9b",
					"enabled": true,
					"removed": false,
					"ruleType": 0,
					"property": 1,
					"logical": 0,
					"conditions": [
						{
							"comparisonType": 3,
							"leftExpression": {
								"type": 1,
								"attribute": "HasAccessToManager"
							},
							"rightExpression": {
								"type": 0,
								"value": true,
								"dataValueType": 12
							}
						}
					]
				}
			}
		}/**SCHEMA_BUSINESS_RULES*/,
		/*publisher*/
		messages: {
			"MyMessageCode": {
        		mode: Terrasoft.MessageMode.PTP,
        		direction: Terrasoft.MessageDirectionType.PUBLISH
		    },
		},
		methods: {
			/*getMyActiveUserContactFilter: function() {
				var activeUserFilter =
					this.Terrasoft.createColumnFilterWithParameter(this.Terrasoft.ComparisonType.EQUAL,
					"[SysAdminUnit:Contact:Id].Active", true);
				return activeUserFilter;
			},*///inactive
			init: function() {
 				this.callParent(arguments);
				// Registering of messages
    				this.sandbox.registerMessages(this.messages);
			},
			/*Validation*/
			setValidationConfig: function() {
                /* Call the initialization of the parent view model's validators. */
                this.callParent(arguments);
                this.addColumnValidator("YangPriceUSD", this.positiveValueValidator);
                this.addColumnValidator("YangAreaSqM", this.positiveValueValidator);
            },
			positiveValueValidator: function(value, column) {
				var msg = "";
				if (value < 0) {
					msg = this.get("Resources.Strings.ValueMustBeGreaterThanZero");
				}
				return {
					invalidMessage: msg
				};
			},
			/*Entity Initialized*/
			onEntityInitialized: function() {
				this.callParent(arguments);
				this.getOperationAccessData();
				this.calculateCommission();
			},
			/*Commission's calculation*/
			calculateCommission: function() {
				var price = this.get("YangPriceUSD");
				if (!price) {
					price = 0;
				}
				var offerTypeObject = this.get("YangOfferType");
				var coeff = 0;
				if (offerTypeObject) {
					coeff = offerTypeObject.YangCommissionCoeff;
				}
				var result = price * coeff;
				this.set("CommissionUSD", result);
			},
			/*AccessToManager*/
			getOperationAccessData: function() {
				/*API*/
				RightUtilities.checkCanExecuteOperation({
					operation: "CanChangeRealtyManager"
				}, this.onGetOperationResult, this);
			},
			onGetOperationResult: function(result) {
				this.set("HasAccessToManager", result);
				this.console.log("HasAccessToManager = "+result);
			},		
			/*MyButton's action*/
			onMyButtonClick: function() {
				this.showInformationDialog("My button was pressed!");
				this.console.log("Yes, it's true. Our button was pressed.");
				
				var obj = {
					value: "5dfa9e9f-8cb8-4de0-b978-41c253f4454b",
					displayValue: "3. Parking Lot",
				};
				this.set("YangType", obj);
				
				this.console.log("Message published.");
				var result = this.sandbox.publish("MyMessageCode", null, []);
				this.console.log("Subscriber responed: " + result);
			},
			getMyButtonEnabled: function() {
				var result = true;
				var name = this.get("YangName");
				if (!name) {
					result = false;
				}
				return result;
			},
			//RunWebServiceButton
			runWebServiceButtonClick: function(){
				//
				var typeObject = this.get("YangType");
				if (!typeObject) {
					return;
				}
				var typeId = typeObject.value;
				
				var offerTypeObject = this.get("YangOfferType");
				if (!offerTypeObject) {
					return;
				}
				var offerTypeId = offerTypeObject.value;
				
				var serviceData = {
					realtyTypeId: typeId,
					realtyOfferTypeId: offerTypeId
				};				
				this.console.log("1");
				ServiceHelper.callService("RealtyService", "GetTotalAmountByTypeId", this.getWebServiceResult, serviceData, this);
				this.console.log("2");
			},
			getWebServiceResult: function(response, success) {
				this.console.log("3");
				this.Terrasoft.showInformation("Total amount by typeId: " + response.GetTotalAmountByTypeIdResult);
			}
		},
		dataModels: /**SCHEMA_DATA_MODELS*/{}/**SCHEMA_DATA_MODELS*/,
		diff: /**SCHEMA_DIFF*/[
			{
				"operation": "insert",
				"name": "YangNamec8aa240b-6ef4-4611-99d0-0b11c65b8a08",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 0,
						"layoutName": "ProfileContainer"
					},
					"bindTo": "YangName",
					"enabled": true
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "FLOAT4ab893d2-8041-4916-bb9c-d11272909ecd",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 1,
						"layoutName": "ProfileContainer"
					},
					"bindTo": "YangPriceUSD",
					"enabled": true
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "FLOAT78ece721-0f4f-4364-ab0a-37f6df9a4d35",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 2,
						"layoutName": "ProfileContainer"
					},
					"bindTo": "YangAreaSqM",
					"enabled": true
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 2
			},
			{
				"operation": "insert",
				"name": "CommissionControl",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 3,
						"layoutName": "ProfileContainer"
					},
					"bindTo": "CommissionUSD",
					"enabled": false,
					"caption": {
						"bindTo": "Resources.Strings.CommissionCaption"
					}
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 3
			},
			//new button
			{
				"operation": "insert",
				"name": "MyButton",
				"values": {
					"layout": {
						"colSpan": 12,
						"rowSpan": 1,
						"column": 0,
						"row": 4,
						"layoutName": "ProfileContainer"
					},
					"itemType": 5,
					"caption": {
						"bindTo": "Resources.Strings.MyButtonCaption"
					},
					"click": {
						"bindTo": "onMyButtonClick"
					},
					"enabled": {
						"bindTo": "getMyButtonEnabled"
					},
					"style": "red"
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 4
			},
			//RunWebServiceButton
			{
				"operation": "insert",
				"name": "RunWebServiceButton",
				"values": {
					"layout": {
						"colSpan": 12,
						"rowSpan": 1,
						"column": 12,
						"row": 4,
						"layoutName": "ProfileContainer"
					},
					"itemType": 5,
					"caption": {
						"bindTo": "Resources.Strings.RunWebServiceButtonCaption"
					},
					"click": {
						"bindTo": "runWebServiceButtonClick"
					},
					"style": "green"
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 5
			},
			{
				"operation": "insert",
				"name": "LOOKUP902ff0fc-91be-4f9a-b99c-9a8274d7425f",
				"values": {
					"layout": {
						"colSpan": 12,
						"rowSpan": 1,
						"column": 0,
						"row": 0,
						"layoutName": "Header"
					},
					"bindTo": "YangType",
					"enabled": true,
					"contentType": 3
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "LOOKUPc7ce0dd4-8680-4611-9696-a07a8d8bbebb",
				"values": {
					"layout": {
						"colSpan": 12,
						"rowSpan": 1,
						"column": 12,
						"row": 0,
						"layoutName": "Header"
					},
					"bindTo": "YangOfferType",
					"enabled": true,
					"contentType": 3
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "STRINGc90c8af9-9d54-493f-a21e-fa6a4fb5d349",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 2,
						"column": 0,
						"row": 1,
						"layoutName": "Header"
					},
					"bindTo": "YangComment",
					"enabled": true,
					"contentType": 0
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 2
			},
			{
				"operation": "insert",
				"name": "LOOKUP9b906bd5-451a-41a3-ad32-509121a294d6",
				"values": {
					"layout": {
						"colSpan": 12,
						"rowSpan": 1,
						"column": 0,
						"row": 3,
						"layoutName": "Header"
					},
					"bindTo": "YangManager",
					"enabled": true,
					"contentType": 5
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 3
			},
			{
				"operation": "insert",
				"name": "Tabfb5c0b2dTabLabel",
				"values": {
					"caption": {
						"bindTo": "Resources.Strings.Tabfb5c0b2dTabLabelTabCaption"
					},
					"items": [],
					"order": 0
				},
				"parentName": "Tabs",
				"propertyName": "tabs",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "YangSchema26b8cca2Detailac7c0d7b",
				"values": {
					"itemType": 2,
					"markerValue": "added-detail"
				},
				"parentName": "Tabfb5c0b2dTabLabel",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "NotesAndFilesTab",
				"values": {
					"caption": {
						"bindTo": "Resources.Strings.NotesAndFilesTabCaption"
					},
					"items": [],
					"order": 1
				},
				"parentName": "Tabs",
				"propertyName": "tabs",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "Files",
				"values": {
					"itemType": 2
				},
				"parentName": "NotesAndFilesTab",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "NotesControlGroup",
				"values": {
					"itemType": 15,
					"caption": {
						"bindTo": "Resources.Strings.NotesGroupCaption"
					},
					"items": []
				},
				"parentName": "NotesAndFilesTab",
				"propertyName": "items",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "Notes",
				"values": {
					"bindTo": "YangNotes",
					"dataValueType": 1,
					"contentType": 4,
					"layout": {
						"column": 0,
						"row": 0,
						"colSpan": 24
					},
					"labelConfig": {
						"visible": false
					},
					"controlConfig": {
						"imageLoaded": {
							"bindTo": "insertImagesToNotes"
						},
						"images": {
							"bindTo": "NotesImagesCollection"
						}
					}
				},
				"parentName": "NotesControlGroup",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "merge",
				"name": "ESNTab",
				"values": {
					"order": 2
				}
			}
		]/**SCHEMA_DIFF*/
	};
});
