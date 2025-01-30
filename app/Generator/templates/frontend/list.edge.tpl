@layout('common/layouts')

@section('content')

<!-- Container -->
<main class="grow content pt-5" id="content" role="content">
  <!-- Container -->
  <div class="container-fixed">
    <div class="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
      <div class="flex flex-col justify-center gap-2">
        <h1 class="text-xl font-medium leading-none text-gray-900">
          {{ trans('list') }}
        </h1>
      </div>
      <div class="flex items-center gap-2.5">
        @if(hasPermission('{{ menu_path }}/list@create'))
        <a href="{{ menu_path }}/create" class="btn btn-sm btn-primary">
          <i class="ki-duotone ki-plus fs-2"></i>
          {{ trans('create') }}
        </a>
        @endif
        @if(hasPermission('{{ menu_path }}/list@batch-remove'))
        <button id="batch_delete_btn" class="btn btn-sm btn-danger" disabled>
          {{ trans('batch delete') }}
        </button>
        @endif
      </div>
    </div>
  </div>
  <!-- End of Container -->
  <!-- Container -->
  <div class="container-fixed">
    <div class="grid gap-5 lg:gap-7.5">
      <div class="card card-grid min-w-full">
        <div class="card-header flex-wrap gap-2">
          <div class="flex flex-wrap gap-2 lg:gap-5">
            <form id="filter_form" class="flex flex-wrap gap-2 lg:gap-5" method="GET" action="{{ menu_path }}/list">
              <div class="flex">
                <label class="input input-sm">
                  <i class="ki-filled ki-magnifier">
                  </i>
                  <input placeholder="{{ trans('search') }}" name="search" type="text"
                    value="{{ request.input('search') || '' }}">
                </label>
              </div>
              <div class="flex flex-wrap gap-2.5">
                <button type="submit" class="btn btn-sm btn-outline btn-primary">
                  <i class="ki-filled ki-setting-4">
                  </i>
                  {{ trans('search') }}
                </button>
                <button type="button" id="reset_filter_btn" class="btn btn-sm btn-outline btn-secondary">
                  <i class="ki-filled ki-arrows-circle"></i>
                  {{ trans('reset') }}
                </button>
              </div>
            </form>
          </div>
        </div>
        <div class="card-body">
          <div data-datatable="false" id="primary_table">
            <div class="scrollable-x-auto">
              <table class="table table-auto table-border " data-datatable-table="true">
                <thead>
                  <tr>
                    {{ checkbox_th }}
                    {{ field_headers }}
                    {{ operation_th }}
                  </tr>
                </thead>
                <tbody>
                  @each(item in list)
                  <tr>
                    {{ checkbox_td }}
                    {{ field_columns }}
                    {{ operation_td }}
                  </tr>
                  @endeach
                </tbody>
              </table>
            </div>
            <div
              class="card-footer justify-center md:justify-between flex-col md:flex-row gap-5 text-gray-600 text-2sm font-medium">
              <div class="flex items-center gap-2 order-2 md:order-1">
                {{ trans('per page') }}
                <select class="select select-sm w-16" data-datatable-size="true" name="perpage">
                </select>
                {{ trans('item') }}
              </div>
              <div class="flex items-center gap-4 order-1 md:order-2">
                <span data-datatable-info="true"></span>
                <div class="pagination" data-datatable-pagination="true">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- End of Container -->
</main>

<script type="application/json" id="server_data">
</script>

<!-- End of Container -->
@endsection

@section('scripts')
<script>
  // 1. 从URL读取参数并设置到表单
  const initialState = Util.setFormFromUrl('#filter_form')

  // 2. 初始化数据表格
  const datatable = Util.initDataTable('#primary_table', {
    apiEndpoint: '/api/{{ api_path }}/get-list',
    pageSize: initialState.pageSize,
    initialPage: initialState.page,
    columns: {
      {{ column_defs }}
    }
  })

  // 3. 处理单行删除
  Util.handleRowDelete({
    tableId: '#primary_table',
    deleteApi: '/api/{{ api_path }}/remove',
    onSuccess: () => {
      datatable.reload()
    }
  })

  // 4. 处理批量删除
  Util.handleBatchDelete({
    tableId: '#primary_table',
    deleteApi: '/api/{{ api_path }}/remove',
    buttonId: '#batch_delete_btn',
    confirmMessage: (count) => trans('confirm delete these items', [count]),
    onSuccess: () => {
      datatable.reload()
    },
    datatable: datatable
  })

  // 5. 处理表单筛选
  Util.handleTableFilter('#filter_form', {
    onSubmit: () => {
      datatable.reload()
      Util.updateUrlParams(Util.getAllTableParams(datatable))
    }
  })

  // 6. 处理重置按钮
  document.querySelector('#reset_filter_btn').addEventListener('click', () => {
    document.querySelector('#filter_form').reset()
    datatable.reload()
    Util.updateUrlParams(Util.getAllTableParams(datatable))
  })
</script>
@endsection
