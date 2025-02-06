@layout('common/layouts')

@section('content')
<!-- Container -->
<main class="grow content pt-5" role="content">
  <div class="container-fixed">
    <div class="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
      <div class="flex flex-col justify-center gap-2">
        <h1 class="text-xl font-medium leading-none text-gray-900">
          {{ trans('view') }}
        </h1>
      </div>
      <div class="flex items-center gap-2.5">
        <button type="button" class="btn btn-sm btn-light" onclick="window.history.back()">
          {{ trans('back') }}
        </button>
        @if(hasPermission('/admin/${module_name}/edit/:id'))
        <a class="btn btn-sm btn-primary" href="/admin/${module_name}/edit/{{ info.${primary_key} }}">
          {{ trans('edit') }}
        </a>
        @endif
      </div>
    </div>
  </div>
  <div class="container-fixed">
    <div class="grid gap-5 lg:gap-7.5">
      <div class="card min-w-full">
        <div class="card-table scrollable-x-auto pb-3">
          <table class="table align-middle text-sm text-gray-500">
            <%each(field in fields)%>
              <%if(field.listable)%>
              <tr>
                <td class="py-2 text-gray-600 font-normal">
                  {{ trans('${field.comment}') }}
                </td>
                <td class="py-2 text-gray-700 font-normal text-sm">
                  <%if(field.form_type === 'rich_editor')%>
                  <div id="${field.name}" class="h-[150px]"></div>
                  <%else%>
                  {{ info.${field.name} }}
                  <%endif%>
                </td>
              </tr>
              <%endif%>
            <%endeach%>
          </table>
        </div>
      </div>
    </div>
  </div>
</main>
<!-- End of Container -->
@endsection

@section('scripts')
<script src="/assets/js/rich_editor/rich_editor.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', async function() {
    try {
      <%each(field in fields)%>
        <%if(field.form_type === 'rich_editor')%>
        // 创建只读编辑器实例
        const ${field.name}Editor = await new RichEditor('#${field.name}', 'readonly');
        // 如果有内容，则设置到编辑器中
        const ${field.name}Data = '{{{ info.${field.name} || '' }}}';
        if (${field.name}Data) {
          ${field.name}Editor.setContents(${field.name}Data);
        }
        <%endif%>
      <%endeach%>
    } catch (error) {
      console.error('编辑器初始化失败:', error);
      Util.errorMsg(trans('please refresh the page and try again'));
    }
  });
</script>
@endsection
