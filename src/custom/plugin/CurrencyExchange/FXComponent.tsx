import {useQueryResult, WidgetPluginProps} from "@activeviam/activeui-sdk";
import {Spin, Table} from "antd";
import axios from "axios"
import React, {FC, useEffect, useState} from "react"

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

export const FXComponent: FC<WidgetPluginProps> = (props) => {

    const [fxRates, setFxRates] = useState([]);
    const [isWaitingForAPI, setIsWaitingForAPI] = useState(true);

    // TODO:  Ex 3-2
    //  1/ use a pivot table to build the query that will allow you to retrieve the currencies from the cube
    //  2/ import the the useQueryResult hook and use it with your query to retrieve the currencies. Don't forget to
    //  3/ use the returned values to: display  a spin if the query has not returned, print the stacktrace of the error if there is one, and finally pass the returned currencies to the api call  to get the rates.
    let {data, error, isLoading} = useQueryResult({
        serverKey: "Ranch-5.10",
        queryId: props.queryId,
        query: {
            mdx: "SELECT\n" +
                "  NON EMPTY Hierarchize(\n" +
                "    Descendants(\n" +
                "      {\n" +
                "        [Currency].[Currency].[AllMember]\n" +
                "      },\n" +
                "      1,\n" +
                "      SELF_AND_BEFORE\n" +
                "    )\n" +
                "  ) ON ROWS\n" +
                "  FROM [EquityDerivativesCube]\n" +
                "  CELL PROPERTIES VALUE, FORMATTED_VALUE, BACK_COLOR, FORE_COLOR, FONT_FLAGS"
        }
    });



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
            const updatedApiUrl = `${apiBaseURl}latest?from=USD&to=${currencies.join(",")}`
            axios.get(updatedApiUrl).then(result => {

                    let ratesTableData: any[] = Object.keys(result.data.rates).map(currency => {
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
    }, [data]);

    if (isLoading) {
        return <Spin/>
    }

    if (error) {
        return <p>{error.stackTrace}</p>
    }

    if (isWaitingForAPI) {
        return <Spin/>
    }



    return (
        <div style={{height:"100%", overflow: "auto" , padding: 5}}>
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