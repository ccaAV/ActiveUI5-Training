import {useQueryResult, WidgetPluginProps} from "@activeviam/activeui-sdk";
import {Spin, Table} from "antd";
import Title from "antd/es/typography/Title";
import axios from "axios"
import React, {FC, useEffect, useState} from "react"
import {FxComponentWidgetState, RatesTableData} from "./FxComponent.types";

const apiBaseURl = "http://api.frankfurter.app/"
const columns = [
    {
        title: 'Currency',
        dataIndex: 'currency',
        key: 'currency'
    },
    {
        title: 'Rate',
        dataIndex: 'rate',
        key: 'rate'
    }
]


// TODO: Ex5 - extend FXComponent with CellSetSelection
export const FXComponent: FC<WidgetPluginProps<FxComponentWidgetState>> = (props) => {

    const [fxRates, setFxRates] = useState<Array<RatesTableData>>([]);
    const [baseCurrency, setbaseCurrency] = useState(props.widgetState.baseCurrency);
    const [isWaitingForAPI, setIsWaitingForAPI] = useState(true);

    //TODO: Ex5 - retrieve the onSelectionChange method from the props
    let {data, error, isLoading} = useQueryResult({
        serverKey: "Ranch-5.10",
        queryId: props.queryId,
        query: {
            mdx: props.widgetState.query
        }
    });

    //TODO  Ex 5, add a useEffect hook so that the added item
    // a/ does not return if data or onSelectionChange are undefined
    // b/ creates a cellSetSelection object defining the baseCurrency in the selected positions on rows
    // c/ calls onSelectionChange passing the new cellSetSelection object
    // d/ the effect should have dependencies on data, onSelectionChange, and baseCurrency
    useEffect(() => {
        setbaseCurrency(props.widgetState.baseCurrency);
    }, [props.widgetState.baseCurrency]);


    // makes the API call to retrieve fxRates, base and date, once we have the data from the cube
    useEffect(() => {
        if (data) {
            let [columnAxis, rowsAxis] = data.axes;
            let currencies = columnAxis.positions.map((position) => {
                if ( position[0].captionPath[1]) {
                    return position[0].captionPath[1]
                }
            });
            console.log(currencies);
            console.log("base", baseCurrency);
            //TODO retrieve the base currency from the new object to pass it to the url
            const updatedApiUrl = `${apiBaseURl}latest?from=${baseCurrency}&to=${currencies.join(",")}`
            axios.get(updatedApiUrl).then(result => {

                    let ratesTableData: RatesTableData[] = Object.keys(result.data.rates).map(currency => {
                        let data = {
                            key: currency,
                            currency: currency,
                            rate: result.data.rates[currency]
                        }
                        return data;
                    });

                    setFxRates(ratesTableData)
                    setIsWaitingForAPI(false);
                }
            ).catch(()=>{
                alert("could not retrieve fx Rates")
            })
        }
    }, [data,baseCurrency]);

    if (isLoading) {
        return <Spin/>
    }

    if (error) {
        return <p>{error.stackTrace}</p>
    }

    if (isWaitingForAPI) {
        return <Spin/>
    }



    // TODO: Ex5 - make sure the new data model is working in the title
    return (
        <div style={{height:"100%", overflow: "auto" , padding: 5}}>
            <Title level={4}>{`Base Currency: ${baseCurrency}`}</Title>
            <Table
                columns={columns}
                dataSource={fxRates}
                size="small"
                bordered
                pagination={false}
            />
        </div>
    )
}