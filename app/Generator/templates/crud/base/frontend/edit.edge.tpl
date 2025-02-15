@layout('common/layouts')

@section('content')
<!-- Container -->
<main class="grow content pt-5" role="content">
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
            <span class="animate-spin inline-block w-4 h-4 border-[2px] border-current border-t-transparent text-white rounded-full" role="status" aria-label="loading"></span>
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
            <input type="hidden" name="${primary_key}" value="{{ info.${primary_key} }}">

            <%each(field in fields)%>
              <%if(field.form_type === 'rich_editor')%>
                <div class="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5 h-[400px] content-start">
                  <label class="form-label max-w-56">
                    {{ trans('${field.comment}') }}
                  </label>
                  <div class="grow h-[250px] max-w-[800px]">
                    <div id="${field.name}"></div>
                  </div>
                </div>
              <%endif%>
              <%if(field.form_type === 'file')%>
                <div class="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                  <label class="form-label max-w-56">
                    {{ trans('${field.comment}') }}
                  </label>
                  <input class="file-input max-w-[300px]" type="file" name="${field.name}" />
                </div>
              <%endif%>
              <%if(field.form_type !== 'rich_editor' && field.form_type !== 'file')%>
                <div class="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                  <label class="form-label max-w-56">
                    {{ trans('${field.comment}') }}
                  </label>
                  <input id="${field.name}" name="${field.name}" class="input max-w-[300px]"
                    placeholder="{{ trans('${field.comment}') }}" type="${field.html_type || 'text'}"
                    value="{{ info.${field.name} || '' }}"
                    />
                </div>
              <%endif%>
            <%endeach%>
          </form>
        </div>
      </div>
    </div>
  </div>
</main>
<!-- End of Container -->
@endsection

@section('scripts')
<script src="/assets/js/rich_editor/rich_editor.js"></script>
<script src="/assets/vendors/@form-validation/form-validation.bundle.js"></script>
<script>
  // 声明为全局变量
  <%each(field in fields)%>
    <%if(field.form_type === 'rich_editor')%>
  var ${field.name}Editor;
    <%endif%>
  <%endeach%>
  var validator;

  /**
   * 初始化表单验证
   */
  function initFormValidation() {
    const form = document.querySelector('#edit_form');

    validator = FormValidation.formValidation(form, {
      fields: {
        <%each(field in fields)%>
          <%if(field.validation)%>
        ${field.name}: {
          validators: {
            notEmpty: {
              message: trans('please enter in the correct format')
            }
          }
        },
          <%endif%>
        <%endeach%>
      },
      plugins: {
        trigger: new FormValidation.plugins.Trigger(),
        bootstrap: new FormValidation.plugins.Bootstrap5({
          rowSelector: '.flex',
          eleInvalidClass: 'border-red-500',
          eleValidClass: 'border-green-500',
          messageClass: 'text-gray-500'
        }),
        submitButton: new FormValidation.plugins.SubmitButton()
      }
    });

    return validator;
  }

  document.addEventListener('DOMContentLoaded', async function() {
    try {
      <%each(field in fields)%>
        <%if(field.form_type === 'rich_editor')%>
      // 创建编辑器实例
      ${field.name}Editor = await new RichEditor('#${field.name}', 'simple');

      // 如果有初始数据，设置到编辑器中
      const ${field.name}Data = '{{{ info.${field.name} || '' }}}';
      if (${field.name}Data) {
        ${field.name}Editor.setContents(${field.name}Data);
      }
        <%endif%>
      <%endeach%>

      // 初始化表单验证
      validator = initFormValidation();

    } catch (error) {
      console.error('初始化失败:', error);
      showError(trans('please refresh the page and try again'));
    }
  });

  /**
   * 处理表单提交
   */
  Util.handleFormSubmit('#edit_form', '#submit_btn', async (formData) => {
    try {
      // 进行表单验证
      const isValid = await validator.validate();
      if (isValid === 'Invalid') {
        throw new Error(trans('please check the form'));
      }

      <%each(field in fields)%>
        <%if(field.form_type === 'rich_editor')%>
      // 获取富文本框内容并添加到表单数据
      if (${field.name}Editor) {
        const content = ${field.name}Editor.getContents();
        formData.append('${field.name}', JSON.stringify(content));
      }
        <%endif%>
      <%endeach%>

      const response = await axios.post('/api/${module_name}/update-info', formData, {
        headers: {
          'token': localStorage.getItem('token')
        }
      });

      if (response.data.code === 0) {
        showSuccess(trans('operation success'), {
          onConfirm: () => {
            window.location.href = '/admin/${module_name}/list';
          }
        })
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
