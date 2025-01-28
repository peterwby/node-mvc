@layout('common/layouts')

@section('content')
<!-- Container -->
<main class="grow content pt-5" id="content" role="content">
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
        @if(hasPermission('{{ menu_path }}/edit/:id'))
        <a class="btn btn-sm btn-primary" href="{{ menu_path }}/edit/{{ info.{{ primary_key }} }}">
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
            {{ field_rows }}
          </table>
        </div>
      </div>
    </div>
  </div>
</main>
<!-- End of Container -->
@endsection

@section('scripts')
@if(has_rich_editor)
<script src="/assets/js/rich_editor/rich_editor.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', async function() {
    try {
      {{ editor_init_code }}
    } catch (error) {
      console.error('编辑器初始化失败:', error);
      Util.errorMsg(trans('please refresh the page and try again'));
    }
  });
</script>
@endif
@endsection
