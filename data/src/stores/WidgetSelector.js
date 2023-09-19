class WidgetSelector {
    list = [
        {
            'data_source':{      //Index 0
                'analytic':[],
                'data_range':'ww',
                'data_unit':'ww',
                'date':[],
                'date_display':'specific',
                'date_end':'',
                'folding_unit':'',
                'row_type':'chart',
                'source':[
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['pin'],
                        'preprocess_type':'people_counting',
                        'sources':[]
                    }]
            },
            'title':'客流量'
        },
        {'data_source':{ //Index 1
                'analytic':[{
                    'caption':'conversion rate',
                    'method':'convert_rate',
                    'preprocess_data':['pin','walkby']
                }],
                'data_range':'ww',
                'data_unit':'ww',
                'date':[],
                'date_display':'',
                'folding_unit':'',
                'row_type':'chart',
                'source':[
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['pin'],
                        'preprocess_type':'people_counting',
                        'sources':[]
                    },
                    {
                        'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['walkby'],
                        'preprocess_type':'wifi',
                        'sources':[]
                    }
                ]},
            'title':"bi_turnin_rate"
        },
        {'data_source':{ //Index 2
                'analytic':[],
                'data_range':'ww',
                'data_unit':'ww',
                'date':[],
                'date_display':'specific',
                'date_end':'',
                'folding_unit':'',
                'row_type':'chart',
                'source':[
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['sales'],
                        'preprocess_type':'pos',
                        'sources':[]
                    }]
            },
            'title':'銷售額'
        },
        {'data_source':{ //Index 3
                'analytic':[],
                'data_range':'ww',
                'data_unit':'ww',
                'date':[],
                'date_display':'specific',
                'date_end':'',
                'folding_unit':'',
                'row_type':'chart',
                'source':[
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['trade_num'],
                        'preprocess_type':'pos',
                        'sources':[]
                    }]
            },
            'title':'交易筆數'
        },
        {'data_source':{ //Index 4
                'analytic':[],
                'data_range':'ww',
                'data_unit':'ww',
                'date':[],
                'date_display':'specific',
                'date_end':'',
                'folding_unit':'',
                'row_type':'chart',
                'source':[
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['goods_num'],
                        'preprocess_type':'pos',
                        'sources':[]
                    }]
            },
            'title':'交易件數'
        },
        {'data_source':{//Index 5
                'analytic':[
                    {
                        'caption':'sales per shopper',
                        'method':'convert_rate',
                        'preprocess_data':[
                            'sales',
                            'trade_num']
                    }
                ],
                'data_range':'ww',
                'data_unit':'ww',
                'date':[],
                'date_display':'specific',
                'date_end':'',
                'folding_unit':'',
                'row_type':'chart',
                'source':[
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['sales'],
                        'preprocess_type':'pos',
                        'sources':[]
                    },
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['goods_num'],
                        'preprocess_type':'pos',
                        'sources':[]
                    }]
            },
            'title':'平均單價'
        },
        {'data_source':{//Index 6
                'analytic':[{
                    'caption':'conversion rate',
                    'method':'convert_rate',
                    'preprocess_data':['trade_num','pin']
                }],
                'data_range':'ww',
                'data_unit':'ww',
                'date':[],
                'date_display':'specific',
                'date_end':'',
                'folding_unit':'',
                'row_type':'chart',
                'source':[
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['trade_num'],
                        'preprocess_type':'pos',
                        'sources':[]
                    },
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['pin'],
                        'preprocess_type':'people_counting',
                        'sources':[]
                    }]
            },
            'title':'提袋率'
        },
        {'data_source':{//Index 7
                'analytic':[
                    {
                        'caption':'sales per shopper',
                        'method':'convert_rate',
                        'preprocess_data':[
                            'sales',
                            'trade_num']
                    }
                ],
                'data_range':'ww',
                'data_unit':'ww',
                'date':[],
                'date_display':'specific',
                'date_end':'',
                'folding_unit':'',
                'row_type':'chart',
                'source':[
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['sales'],
                        'preprocess_type':'pos',
                        'sources':[]
                    },
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['trade_num'],
                        'preprocess_type':'pos',
                        'sources':[]
                    }]
            },
            'title':"bi_people_single_buy"
        },
        {'data_source':{ //Index 8
                'analytic':[{
                    'caption':'conversion rate',
                    'method':'convert_rate',
                    'preprocess_data':['goods_num','trade_num']
                }],
                'data_range':'ww',
                'data_unit':'ww',
                'date':[],
                'date_display':'specific',
                'date_end':'',
                'folding_unit':'',
                'row_type':'chart',
                'source':[
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['goods_num'],
                        'preprocess_type':'pos',
                        'sources':[]
                    },
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['trade_num'],
                        'preprocess_type':'pos',
                        'sources':[]
                    }]
            },
            'title':'連帶率'
        },
        {
            'data_source':{      //Index 9
                'analytic':[],
                'data_range':'ww',
                'data_unit':'ww',
                'date':[],
                'date_display':'specific',
                'date_end':'',
                'folding_unit':'',
                'row_type':'chart',
                'source':[
                  {
                      'caption':'All Regions',
                      'chart_type':['kpi'],
                      'merge_type':'sum',
                      'preprocess_data':['walkby'],
                      'preprocess_type':'wifi',
                      'sources':[]
                  }]
            },
            'title':'店外客流'
        },
        {
            'data_source':{ // Index 10
                'analytic':[
                    {'caption':'returning customers',
                        'method':'convert_rate',
                        'preprocess_data':[
                            'old_uniq',
                            'enter_uniq'
                        ]}
                ],
                'data_range':'ww',
                'data_unit':'ww',
                'date':[],
                'date_display':'specific',
                'date_end':'',
                'folding_unit':'',
                'row_type':'chart',
                'source':[
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['old_uniq'],
                        'preprocess_type':'wifi',
                        'sources':[]
                    },
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['enter_uniq'],
                        'preprocess_type':'wifi',
                        'sources':[]
                    }]
            },
            'title':"bi_teturncustom_rate"
        },
        {
            'data_source':{// Index 11
                'analytic':[{
                    'caption':'conversion rate',
                    'method':'convert_rate',
                    'preprocess_data':['pin','staff_num']
                }],
                'data_range':'ww',
                'data_unit':'ww',
                'date':[],
                'date_display':'specific',
                'date_end':'',
                'folding_unit':'',
                'row_type':'chart',
                'source':[
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['pin'],
                        'preprocess_type':'people_counting',
                        'sources':[]
                    },
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['staff_num'],
                        'preprocess_type':'store_property',
                        'sources':[]
                    }]
            },
            'title':'編制服務數'
        },

        {
            'data_source':{// Index 12
                'analytic':[{
                    'caption':'conversion rate',
                    'method':'convert_rate',
                    'preprocess_data':['sales','staff_num']
                }],
                'data_range':'ww',
                'data_unit':'ww',
                'date':[],
                'date_display':'specific',
                'date_end':'',
                'folding_unit':'',
                'row_type':'chart',
                'source':[
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['sales'],
                        'preprocess_type':'pos',
                        'sources':[]
                    },
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['staff_num'],
                        'preprocess_type':'store_property',
                        'sources':[]
                    }]
            },
            'title':'人均產值'
        },

        {
            'data_source':{// Index 13
                'analytic':[{
                    'caption':'conversion rate',
                    'method':'convert_rate',
                    'preprocess_data':['sales','area']
                }],
                'data_range':'ww',
                'data_unit':'ww',
                'date':[],
                'date_display':'specific',
                'date_end':'',
                'folding_unit':'',
                'row_type':'chart',
                'source':[
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['sales'],
                        'preprocess_type':'pos',
                        'sources':[]
                    },
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['area'],
                        'preprocess_type':'store_property',
                        'sources':[]
                    }]
            },
            'title':'坪效'
        },
        {
            'data_source':{// Index 14
                'analytic':[{
                    'caption':'conversion rate',
                    'method':'convert_rate',
                    'preprocess_data':['rent','trade_num']
                }],
                'data_range':'ww',
                'data_unit':'ww',
                'date':[],
                'date_display':'specific',
                'date_end':'',
                'folding_unit':'',
                'row_type':'chart',
                'source':[
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['rent'],
                        'preprocess_type':'store_property',
                        'sources':[]
                    },
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['trade_num'],
                        'preprocess_type':'pos',
                        'sources':[]
                    }
                ]
            },
            'title':'單位成交成本'
        },
        {
            'data_source':{// Index 15
                'analytic':[{
                    'caption':'conversion rate',
                    'method':'convert_rate',
                    'preprocess_data':['rent','pin']
                }],
                'data_range':'ww',
                'data_unit':'ww',
                'date':[],
                'date_display':'specific',
                'date_end':'',
                'folding_unit':'',
                'row_type':'chart',
                'source':[
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['rent'],
                        'preprocess_type':'store_property',
                        'sources':[]
                    },
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'sum',
                        'preprocess_data':['pin'],
                        'preprocess_type':'people_counting',
                        'sources':[]
                    }
                ]
            },
            'title':'單位人流成本'
        },
        {
            'data_source':{      //Index 16
                'analytic':[],
                'data_range':'dd',
                'data_unit':'hh',
                'date':[],
                'date_display':'specific',
                'date_end':'',
                'folding_unit':'',
                'row_type':'chart',
                'source':[
                    { 'caption':'All Regions',
                        'chart_type':['kpi'],
                        'merge_type':'none',
                        'preprocess_data':['conditions','avg_temp_c','high_temp_c','low_temp_c'],
                        'preprocess_type':'weather',
                        'sources':[]
                    }]
            },
            'title':'天氣'
        },
    ]
}

export default new WidgetSelector()
