@layout('common/layouts')

@section('content')
<!-- Container -->
<main class="grow content pt-5" id="content" role="content">
  <div class="container-fixed">
    <div class="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
      <div class="flex flex-col justify-center gap-2">
        <h1 class="text-xl font-medium leading-none text-gray-900">
          {{ trans('edit') }}
        </h1>
      </div>
      <div class="flex items-center gap-2.5">
        <button type="button" class="btn btn-sm btn-light" onclick="window.history.back()">
          {{ trans('back') }}
        </button>
        <button type="submit" class="btn btn-sm btn-primary" form="edit_form" id="submit_btn">
          <span class="indicator-label">{{ trans('submit') }}</span>
          <span class="indicator-progress hidden">
            <span
              class="animate-spin inline-block w-4 h-4 border-[2px] border-current border-t-transparent text-white rounded-full"
              role="status" aria-label="loading"></span>
          </span>
        </button>
      </div>
    </div>
  </div>
  <div class="container-fixed">
    <div class="grid gap-5 lg:gap-7.5">
      <div class="card min-w-full">
        <div class="card-body">
          <form id="edit_form" class="grid gap-5" method="POST">
            {{ form_fields }}
          </form>
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
@endif
<script src="/assets/vendors/@form-validation/form-validation.bundle.js"></script>
<script>
  @if(has_rich_editor)
  // 声明为全局变量
  var editors = {};
  @endif

  var validator;

  /**
   * 初始化表单验证
   * @param {string} formId - 表单元素的ID
   * @returns {Object} - FormValidation实例
   */
  function initFormValidation(formId) {
    const form = document.querySelector(formId);

    const validator = FormValidation.formValidation(form, {
      fields: {
        {{ validation_rules }}
      },
      plugins: {
        trigger: new FormValidation.plugins.Trigger(),
        bootstrap: new FormValidation.plugins.Bootstrap5({
          rowSelector: '.flex',
          eleInvalidClass: 'border-red-500',
          eleValidClass: 'border-green-500',
          messageClass: 'text-gray-500'
        }),
        submitButton: new FormValidation.plugins.SubmitButton(),
      }
    });

    return validator;
  }

  document.addEventListener('DOMContentLoaded', async function() {
    try {
      @if(has_rich_editor)
      {{ editor_init_code }}
      @endif

      // 初始化表单验证
      validator = initFormValidation('#edit_form');
    } catch (error) {
      console.error('初始化失败:', error);
      Util.errorMsg(trans('please refresh the page and try again'));
    }
  });

  /**
   * 通用表单提交处理函数
   */
  Util.handleFormSubmit('#edit_form', '#submit_btn', async (formData) => {
    try {
      // 进行表单验证
      const isValid = await validator.validate();
      if (isValid === 'Invalid') {
        throw new Error(trans('please check the form'));
      }

      @if(has_rich_editor)
      // 获取富文本框内容并添加到表单数据
      @each(field in rich_editor_fields)
      if (editors['{{ field.name }}']) {
        const content = editors['{{ field.name }}'].getContents();
        formData.append('{{ field.name }}', JSON.stringify(content));
      }
      @endeach
      @endif

      const response = await axios.post('/api{{ menu_path }}/update-info', formData, {
        headers: {
          'token': localStorage.getItem('token')
        }
      });

      if (response.data.code === 0) {
        Util.successMsg(trans('operation success'), () => {
          window.location.href = '{{ menu_path }}/list';
        });
        return response.data;
      } else {
        throw new Error(response.data.msg || trans('operation failed'));
      }
    } catch (error) {
      console.error(trans('operation failed') + ':', error);
      throw error;
    }
  });
</script>
@endsection
