@layout('common/layouts')

@section('content')
<!-- Container -->
<main class="grow content pt-5" id="content" role="content">
  <!-- Container -->
  <div class="container-fixed">
    <div class="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
      <div class="flex flex-col justify-center gap-2">
        <h1 class="text-xl font-medium leading-none text-gray-900">
          {{ trans(${module_name}) }} {{ trans('list') }}
        </h1>
        <p class="text-sm text-gray-500">{{ trans('total_items', { count: total }) }}</p>
      </div>
      <div class="flex items-center gap-2.5">
        <%if(has_create_permission)%>
        <a href="/admin/${module_name}/create" class="btn btn-sm btn-primary">
          <i class="ki-duotone ki-plus fs-2"></i>
          {{ trans('create') }}
        </a>
        <%endif%>
        <%if(has_batch_delete_permission)%>
        <button id="batch_delete_btn" class="btn btn-sm btn-danger" disabled>
          {{ trans('batch delete') }}
        </button>
        <%endif%>
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
            <form id="filter_form" class="flex flex-wrap gap-2 lg:gap-5" method="GET" action="/admin/${module_name}/list">
              <%each(field in fields)%>
                <%if(field.filterable)%>
                <div class="flex">
                  <label class="input input-sm">
                    <i class="ki-filled ki-magnifier"></i>
                    <input placeholder="{{ trans(${field.comment}) }}" name="${field.alias}" type="${field.type || 'text'}" value="{{ request.input('${field.alias}') || '' }}">
                  </label>
                </div>
                <%endif%>
              <%endeach%>
              <div class="flex flex-wrap gap-2.5">
                <button type="submit" class="btn btn-sm btn-outline btn-primary">
                  <i class="ki-filled ki-setting-4"></i>
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
              <table class="table table-auto table-border" data-datatable-table="true">
                <thead>
                  <tr>
                    <%if(has_primary_key)%>
                    <th class="w-1">
                      <input class="form-check-input m-0 align-middle" type="checkbox" aria-label="全选"
                             onclick="toggleAllCheckbox(this)">
                    </th>
                    <%endif%>
                    <%each(field in fields)%>
                      <%if(field.listable)%>
                      <th class="min-w-[${field.min_width || '200px'}]">
                        <span class="sort ${field.sort_direction || 'asc'}">
                          <span class="sort-label font-normal text-gray-700">
                            {{ trans(${field.comment}) }}
                          </span>
                          <span class="sort-icon"></span>
                        </span>
                      </th>
                      <%endif%>
                    <%endeach%>
                    <th class="w-[60px]"></th>
                  </tr>
                </thead>
              </table>
            </div>
            <div class="card-footer justify-center md:justify-between flex-col md:flex-row gap-5 text-gray-600 text-2sm font-medium">
              <div class="flex items-center gap-2 order-2 md:order-1">
                {{ trans('per page') }}
                <select class="select select-sm w-16" data-datatable-size="true" name="perpage"></select>
                {{ trans('item') }}
              </div>
              <div class="flex items-center gap-4 order-1 md:order-2">
                <span data-datatable-info="true"></span>
                <div class="pagination" data-datatable-pagination="true"></div>
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
    apiEndpoint: '/api/${module_name}/get-list',
    pageSize: initialState.pageSize,
    initialPage: initialState.page,
    columns: {
      <%if(has_primary_key)%>
      checkbox: {
        render: (item) => {
          return '<input class="form-check-input m-0 align-middle" type="checkbox" value="' + item.${primary_key} + '">'
        },
      },
      <%endif%>
      <%each(field in fields)%>
        <%if(field.listable)%>
        ${field.alias}: {
          <%if(field.render)%>
          render: ${field.render},
          <%else%>
          render: (item) => {
            <%if(field.type === 'image')%>
            return '<div class="symbol symbol-35px">' +
              '<img src="' + (item || '/assets/media/avatars/default.png') + '" alt="image" class="w-[35px] h-[35px] rounded-full">' +
              '</div>'
            <%elseif(field.type === 'status')%>
            const statusClass = item === trans('enable') ? 'text-success' : 'text-danger'
            return '<div class="' + statusClass + ' font-medium">' + item + '</div>'
            <%elseif(field.type === 'datetime')%>
            return '<div>' + (item ? Util.formatDate(item) : trans('no data')) + '</div>'
            <%else%>
            return '<div>' + (item || trans('no data')) + '</div>'
            <%endif%>
          },
          <%endif%>
        },
        <%endif%>
      <%endeach%>
      action: {
        render: (item, data) => {
          return '<div class="menu flex-inline" data-menu="true">' +
            '<div class="menu-item" data-menu-item-offset="0, 10px" data-menu-item-placement="bottom-end" data-menu-item-placement-rtl="bottom-start" data-menu-item-toggle="dropdown" data-menu-item-trigger="click|lg:click">' +
            '<button class="menu-toggle btn btn-sm btn-icon btn-light btn-clear">' +
            '<i class="ki-filled ki-dots-vertical"></i>' +
            '</button>' +
            '<div class="menu-dropdown menu-default w-full max-w-[120px]" data-menu-dismiss="true">' +
            '<div class="menu-item">' +
            '<a class="menu-link" href="/admin/${module_name}/view/' + data.${module_id_field} + '">' +
            '<span class="menu-title">' + trans('view') + '</span>' +
            '</a>' +
            '</div>' +
            <%if(has_edit_permission)%>
            '<div class="menu-item">' +
            '<a class="menu-link" href="/admin/${module_name}/edit/' + data.${module_id_field} + '">' +
            '<span class="menu-title">' + trans('edit') + '</span>' +
            '</a>' +
            '</div>' +
            <%endif%>
            '<div class="menu-separator"></div>' +
            <%if(has_delete_permission)%>
            '<div class="menu-item">' +
            '<button type="button" class="menu-link remove-btn" data-id="' + data.${module_id_field} + '">' +
            '<span class="menu-title">' + trans('delete') + '</span>' +
            '</button>' +
            '</div>' +
            <%endif%>
            '</div>' +
            '</div>' +
            '</div>'
        },
      },
    }
  })

  // 3. 处理单行删除
  Util.handleRowDelete({
    tableId: '#primary_table',
    deleteApi: '/api/${module_name}/remove',
    onSuccess: () => {
      datatable.reload()
    }
  })

  // 4. 处理批量删除
  Util.handleBatchDelete({
    tableId: '#primary_table',
    deleteApi: '/api/${module_name}/remove',
    buttonId: '#batch_delete_btn',
    confirmMessage: (count) => trans('confirm delete these items', [count]),
    onSuccess: () => {
      datatable.reload()
    }
  })

  <%if(has_primary_key && has_batch_delete_permission)%>
  function toggleAllCheckbox(checkbox) {
    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]')
    checkboxes.forEach(item => item.checked = checkbox.checked)
  }

  function batchDelete() {
    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]:checked')
    if (checkboxes.length === 0) {
      alert('请选择要删除的记录')
      return
    }

    if (!confirm('确定要删除选中的记录吗？')) {
      return
    }

    const ids = Array.from(checkboxes).map(checkbox => checkbox.value)

    fetch('/api/${module_name}/batch-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    })
    .then(response => response.json())
    .then(result => {
      if (result.code === 0) {
        datatable.reload()
      } else {
        alert(result.message)
      }
    })
  }
  <%endif%>

  // 5. 处理重置按钮
  document.getElementById('reset_filter_btn').addEventListener('click', () => {
    document.getElementById('filter_form').reset()
    document.getElementById('filter_form').submit()
  })
</script>
@endsection
